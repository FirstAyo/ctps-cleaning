import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ROLE_KEYS } from "@ctps/permissions";
import type { AssignRolesInput, CreateUserInput, UpdateUserInput } from "@ctps/validation";

import { DatabaseService } from "../database/database.service";
import { AuditService } from "../auth/audit.service";
import { PasswordService } from "../auth/password.service";
import { SessionService } from "../auth/session.service";

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  status: true,
  mustChangePassword: true,
  lastLoginAt: true,
  passwordChangedAt: true,
  disabledAt: true,
  createdAt: true,
  updatedAt: true,
  roles: { include: { role: { select: { id: true, key: true, displayName: true } } } },
} as const;

@Injectable()
export class UsersService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(PasswordService) private readonly passwords: PasswordService,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list(query: {
    page: number;
    pageSize: number;
    search?: string;
    status?: "ACTIVE" | "DISABLED";
  }) {
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search.toLowerCase(), mode: "insensitive" as const } },
              { displayName: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.database.client.$transaction([
      this.database.client.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: userSelect,
      }),
      this.database.client.user.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async get(id: string) {
    const user = await this.database.client.user.findUnique({ where: { id }, select: userSelect });
    if (!user)
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "The staff account was not found.",
      });
    return user;
  }

  async create(input: CreateUserInput, actorUserId: string) {
    if (
      await this.database.client.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      })
    ) {
      throw new ConflictException({
        code: "EMAIL_CONFLICT",
        message: "A staff account already uses that email.",
      });
    }
    const roles = await this.database.client.role.findMany({
      where: { id: { in: input.roleIds } },
      select: { id: true },
    });
    if (roles.length !== new Set(input.roleIds).size)
      throw new ConflictException({
        code: "ROLE_CONFLICT",
        message: "One or more roles are unavailable.",
      });
    const temporaryPassword = this.passwords.generateTemporaryPassword();
    const passwordHash = await this.passwords.hash(temporaryPassword);
    const user = await this.database.client.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        passwordHash,
        mustChangePassword: true,
        roles: { create: roles.map((role) => ({ roleId: role.id, assignedBy: actorUserId })) },
      },
      select: userSelect,
    });
    await this.audit.record({
      actorUserId,
      action: "user.created",
      resourceType: "user",
      resourceId: user.id,
      metadata: { roleIds: roles.map(({ id }) => id), mustChangePassword: true },
    });
    return { user, temporaryPassword };
  }

  async update(id: string, input: UpdateUserInput, actorUserId: string) {
    await this.get(id);
    if (input.email) {
      const conflict = await this.database.client.user.findFirst({
        where: { email: input.email, id: { not: id } },
        select: { id: true },
      });
      if (conflict)
        throw new ConflictException({
          code: "EMAIL_CONFLICT",
          message: "A staff account already uses that email.",
        });
    }
    const data = {
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
    };
    const user = await this.database.client.user.update({
      where: { id },
      data,
      select: userSelect,
    });
    await this.audit.record({
      actorUserId,
      action: "user.updated",
      resourceType: "user",
      resourceId: id,
      metadata: { changedFields: Object.keys(input) },
    });
    return user;
  }

  async assignRoles(id: string, input: AssignRolesInput, actorUserId: string) {
    const roles = await this.database.client.role.findMany({
      where: { id: { in: input.roleIds } },
      select: { id: true, key: true },
    });
    if (roles.length !== new Set(input.roleIds).size)
      throw new ConflictException({
        code: "ROLE_CONFLICT",
        message: "One or more roles are unavailable.",
      });
    const remainsSuper = roles.some(({ key }) => key === ROLE_KEYS.SUPER_ADMIN);
    await this.database.client.$transaction(
      async (transaction) => {
        const user = await transaction.user.findUnique({
          where: { id },
          select: { status: true, roles: { include: { role: { select: { key: true } } } } },
        });
        if (!user)
          throw new NotFoundException({
            code: "USER_NOT_FOUND",
            message: "The staff account was not found.",
          });
        const currentlySuper = user.roles.some(({ role }) => role.key === ROLE_KEYS.SUPER_ADMIN);
        if (user.status === "ACTIVE" && currentlySuper && !remainsSuper) {
          const activeSuperAdmins = await transaction.user.count({
            where: { status: "ACTIVE", roles: { some: { role: { key: ROLE_KEYS.SUPER_ADMIN } } } },
          });
          if (activeSuperAdmins <= 1)
            throw new ConflictException({
              code: "FINAL_SUPER_ADMIN",
              message: "The final active Super Admin role cannot be removed.",
            });
        }
        await transaction.userRole.deleteMany({ where: { userId: id } });
        if (roles.length)
          await transaction.userRole.createMany({
            data: roles.map((role) => ({ userId: id, roleId: role.id, assignedBy: actorUserId })),
          });
      },
      { isolationLevel: "Serializable" },
    );
    await this.audit.record({
      actorUserId,
      action: "user.roles.assigned",
      resourceType: "user",
      resourceId: id,
      metadata: { roleIds: roles.map(({ id: roleId }) => roleId) },
    });
    return this.get(id);
  }

  async disable(id: string, actorUserId: string) {
    const updated = await this.database.client.$transaction(
      async (transaction) => {
        const user = await transaction.user.findUnique({
          where: { id },
          select: { status: true, roles: { include: { role: { select: { key: true } } } } },
        });
        if (!user)
          throw new NotFoundException({
            code: "USER_NOT_FOUND",
            message: "The staff account was not found.",
          });
        const isSuper = user.roles.some(({ role }) => role.key === ROLE_KEYS.SUPER_ADMIN);
        if (user.status === "ACTIVE" && isSuper) {
          const activeSuperAdmins = await transaction.user.count({
            where: { status: "ACTIVE", roles: { some: { role: { key: ROLE_KEYS.SUPER_ADMIN } } } },
          });
          if (activeSuperAdmins <= 1)
            throw new ConflictException({
              code: "FINAL_SUPER_ADMIN",
              message: "The final active Super Admin cannot be disabled.",
            });
        }
        return transaction.user.update({
          where: { id },
          data: { status: "DISABLED", disabledAt: new Date() },
          select: userSelect,
        });
      },
      { isolationLevel: "Serializable" },
    );
    await this.sessions.revokeAll(id, "account-disabled");
    await this.audit.record({
      actorUserId,
      action: "user.disabled",
      resourceType: "user",
      resourceId: id,
    });
    return updated;
  }

  async reactivate(id: string, actorUserId: string) {
    await this.get(id);
    const user = await this.database.client.user.update({
      where: { id },
      data: { status: "ACTIVE", disabledAt: null },
      select: userSelect,
    });
    await this.audit.record({
      actorUserId,
      action: "user.reactivated",
      resourceType: "user",
      resourceId: id,
    });
    return user;
  }

  async resetPassword(id: string, actorUserId: string) {
    await this.get(id);
    const temporaryPassword = this.passwords.generateTemporaryPassword();
    const passwordHash = await this.passwords.hash(temporaryPassword);
    await this.database.client.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true, passwordChangedAt: new Date() },
    });
    await this.sessions.revokeAll(id, "administrator-password-reset");
    await this.audit.record({
      actorUserId,
      action: "user.password.reset",
      resourceType: "user",
      resourceId: id,
      metadata: { sessionsRevoked: true, mustChangePassword: true },
    });
    return { temporaryPassword };
  }
}
