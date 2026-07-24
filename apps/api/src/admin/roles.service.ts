import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { isPermissionKey, ROLE_KEYS } from "@ctps/permissions";
import type { AssignPermissionsInput, CreateRoleInput, UpdateRoleInput } from "@ctps/validation";

import { AuditService } from "../auth/audit.service";
import { DatabaseService } from "../database/database.service";

const roleInclude = {
  permissions: { include: { permission: true }, orderBy: { permission: { key: "asc" as const } } },
  _count: { select: { users: true } },
} as const;

@Injectable()
export class RolesService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  list() {
    return this.database.client.role.findMany({
      orderBy: [{ isSystem: "desc" }, { displayName: "asc" }],
      include: roleInclude,
    });
  }

  async get(id: string) {
    const role = await this.database.client.role.findUnique({
      where: { id },
      include: roleInclude,
    });
    if (!role)
      throw new NotFoundException({ code: "ROLE_NOT_FOUND", message: "The role was not found." });
    return role;
  }

  listPermissions() {
    return this.database.client.permission.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
    });
  }

  async create(input: CreateRoleInput, actorUserId: string) {
    if (
      Object.values(ROLE_KEYS).includes(input.key as (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS]) ||
      (await this.database.client.role.findUnique({ where: { key: input.key } }))
    ) {
      throw new ConflictException({
        code: "ROLE_KEY_CONFLICT",
        message: "That role key is reserved or already exists.",
      });
    }
    const role = await this.database.client.role.create({
      data: { ...input, isSystem: false },
      include: roleInclude,
    });
    await this.audit.record({
      actorUserId,
      action: "role.created",
      resourceType: "role",
      resourceId: role.id,
      metadata: { key: role.key },
    });
    return role;
  }

  async update(id: string, input: UpdateRoleInput, actorUserId: string) {
    const existing = await this.get(id);
    if (existing.isSystem)
      throw new ConflictException({
        code: "SYSTEM_ROLE_PROTECTED",
        message: "System role identity and descriptions are managed by initialization.",
      });
    const data = {
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    };
    const role = await this.database.client.role.update({
      where: { id },
      data,
      include: roleInclude,
    });
    await this.audit.record({
      actorUserId,
      action: "role.updated",
      resourceType: "role",
      resourceId: id,
      metadata: { changedFields: Object.keys(input) },
    });
    return role;
  }

  async assignPermissions(id: string, input: AssignPermissionsInput, actorUserId: string) {
    const role = await this.get(id);
    if (role.key === ROLE_KEYS.SUPER_ADMIN) {
      throw new ConflictException({
        code: "SUPER_ADMIN_INVARIANT",
        message: "The Super Admin role always receives every existing permission.",
      });
    }
    const requested = [...new Set(input.permissionKeys)];
    if (!requested.every(isPermissionKey))
      throw new ConflictException({
        code: "UNKNOWN_PERMISSION",
        message: "One or more permission keys are unknown.",
      });
    const permissions = await this.database.client.permission.findMany({
      where: { key: { in: requested } },
      select: { id: true, key: true },
    });
    if (permissions.length !== requested.length)
      throw new ConflictException({
        code: "UNKNOWN_PERMISSION",
        message: "One or more permission keys are unavailable.",
      });
    await this.database.client.$transaction(async (transaction) => {
      await transaction.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissions.length)
        await transaction.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: id,
            permissionId: permission.id,
            assignedBy: actorUserId,
          })),
        });
    });
    await this.audit.record({
      actorUserId,
      action: "role.permissions.assigned",
      resourceType: "role",
      resourceId: id,
      metadata: { permissionKeys: requested },
    });
    return this.get(id);
  }
}
