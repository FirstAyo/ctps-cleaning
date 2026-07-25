import type { PrismaClient } from "@ctps/database";
import {
  ALL_PERMISSION_KEYS,
  PERMISSION_DEFINITIONS,
  PERMISSION_KEYS,
  ROLE_KEYS,
} from "@ctps/permissions";

const roleDefinitions = [
  {
    key: ROLE_KEYS.SUPER_ADMIN,
    displayName: "Super Admin",
    description: "Protected system role with every existing permission.",
  },
  {
    key: ROLE_KEYS.ADMIN,
    displayName: "Admin",
    description: "Configurable staff administrator role.",
  },
  {
    key: ROLE_KEYS.AUTHOR,
    displayName: "Author",
    description: "Staff author with ownership-scoped blog publishing access.",
  },
] as const;

export async function initializeSystemAccess(
  prisma: PrismaClient,
): Promise<{ roles: number; permissions: number }> {
  return prisma.$transaction(async (transaction) => {
    const permissions = new Map<string, string>();
    for (const definition of PERMISSION_DEFINITIONS) {
      const permission = await transaction.permission.upsert({
        where: { key: definition.key },
        create: {
          key: definition.key,
          displayName: definition.label,
          description: definition.description,
          group: definition.group,
        },
        update: {
          displayName: definition.label,
          description: definition.description,
          group: definition.group,
        },
      });
      permissions.set(definition.key, permission.id);
    }

    const roles = new Map<string, string>();
    for (const definition of roleDefinitions) {
      const role = await transaction.role.upsert({
        where: { key: definition.key },
        create: { ...definition, isSystem: true },
        update: {
          displayName: definition.displayName,
          description: definition.description,
          isSystem: true,
        },
      });
      roles.set(definition.key, role.id);
    }

    const defaults: Record<string, readonly string[]> = {
      [ROLE_KEYS.SUPER_ADMIN]: ALL_PERMISSION_KEYS,
      [ROLE_KEYS.ADMIN]: [PERMISSION_KEYS.ADMIN_ACCESS],
      [ROLE_KEYS.AUTHOR]: [
        PERMISSION_KEYS.ADMIN_ACCESS,
        PERMISSION_KEYS.BLOG_POSTS_READ_OWN,
        PERMISSION_KEYS.BLOG_POSTS_CREATE,
        PERMISSION_KEYS.BLOG_POSTS_UPDATE_OWN,
        PERMISSION_KEYS.BLOG_POSTS_PUBLISH_OWN,
        PERMISSION_KEYS.BLOG_POSTS_SCHEDULE_OWN,
        PERMISSION_KEYS.BLOG_POSTS_ARCHIVE_OWN,
        PERMISSION_KEYS.BLOG_POSTS_DELETE_OWN,
        PERMISSION_KEYS.BLOG_MEDIA_UPLOAD_OWN,
        PERMISSION_KEYS.BLOG_MEDIA_READ_OWN,
        PERMISSION_KEYS.BLOG_MEDIA_UPDATE_OWN,
        PERMISSION_KEYS.BLOG_MEDIA_DELETE_OWN,
        PERMISSION_KEYS.BLOG_CATEGORIES_READ,
        PERMISSION_KEYS.BLOG_TAGS_READ,
        PERMISSION_KEYS.AUTHOR_PROFILES_READ,
        PERMISSION_KEYS.AUTHOR_PROFILES_UPDATE_OWN,
        PERMISSION_KEYS.BLOG_REVISIONS_READ_OWN,
        PERMISSION_KEYS.BLOG_REVISIONS_RESTORE_OWN,
      ],
    };
    for (const [roleKey, permissionKeys] of Object.entries(defaults)) {
      const roleId = roles.get(roleKey);
      if (!roleId) throw new Error(`System role initialization failed: ${roleKey}`);
      for (const permissionKey of permissionKeys) {
        const permissionId = permissions.get(permissionKey);
        if (!permissionId) throw new Error(`Permission initialization failed: ${permissionKey}`);
        await transaction.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          create: { roleId, permissionId },
          update: {},
        });
      }
    }
    return { roles: roles.size, permissions: permissions.size };
  });
}
