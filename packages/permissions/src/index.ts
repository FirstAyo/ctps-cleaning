export const ROLE_KEYS = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  AUTHOR: "AUTHOR",
} as const;

export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];

export const PERMISSION_KEYS = {
  ADMIN_ACCESS: "admin.access",
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DISABLE: "users.disable",
  USERS_ASSIGN_ROLES: "users.assignRoles",
  ROLES_READ: "roles.read",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_ASSIGN_PERMISSIONS: "roles.assignPermissions",
  AUDIT_READ: "audit.read",
  SESSIONS_READ_OWN: "sessions.readOwn",
  SESSIONS_REVOKE_OWN: "sessions.revokeOwn",
  PROJECTS_BEFORE_AFTER_READ: "projects.beforeAfter.read",
  PROJECTS_BEFORE_AFTER_CREATE: "projects.beforeAfter.create",
  PROJECTS_BEFORE_AFTER_UPDATE: "projects.beforeAfter.update",
  PROJECTS_BEFORE_AFTER_PUBLISH: "projects.beforeAfter.publish",
  PROJECTS_BEFORE_AFTER_ARCHIVE: "projects.beforeAfter.archive",
  PROJECTS_BEFORE_AFTER_DELETE: "projects.beforeAfter.delete",
  MEDIA_BEFORE_AFTER_UPLOAD: "media.beforeAfter.upload",
  MEDIA_BEFORE_AFTER_READ: "media.beforeAfter.read",
  MEDIA_BEFORE_AFTER_UPDATE: "media.beforeAfter.update",
  MEDIA_BEFORE_AFTER_DELETE: "media.beforeAfter.delete",
  QUOTE_REQUESTS_READ: "quoteRequests.read",
  QUOTE_REQUESTS_UPDATE: "quoteRequests.update",
  QUOTE_REQUESTS_CHANGE_STATUS: "quoteRequests.changeStatus",
  QUOTE_REQUESTS_ASSIGN: "quoteRequests.assign",
  QUOTE_REQUESTS_ADD_INTERNAL_NOTES: "quoteRequests.addInternalNotes",
  QUOTE_REQUESTS_READ_PRIVATE_MEDIA: "quoteRequests.readPrivateMedia",
  QUOTE_REQUESTS_ARCHIVE: "quoteRequests.archive",
  QUOTE_REQUESTS_DELETE: "quoteRequests.delete",
} as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];
export type PermissionGroup =
  "Administration" | "Users" | "Roles" | "Security" | "Projects" | "Media" | "Quote Requests";

export interface PermissionDefinition {
  readonly key: PermissionKey;
  readonly label: string;
  readonly description: string;
  readonly group: PermissionGroup;
}

export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  {
    key: PERMISSION_KEYS.ADMIN_ACCESS,
    label: "Access staff dashboard",
    description: "Sign in and access the protected admin foundation.",
    group: "Administration",
  },
  {
    key: PERMISSION_KEYS.USERS_READ,
    label: "Read users",
    description: "View staff accounts and role summaries.",
    group: "Users",
  },
  {
    key: PERMISSION_KEYS.USERS_CREATE,
    label: "Create users",
    description: "Create staff accounts with one-time temporary passwords.",
    group: "Users",
  },
  {
    key: PERMISSION_KEYS.USERS_UPDATE,
    label: "Update users",
    description: "Update staff display names, emails, status, and temporary passwords.",
    group: "Users",
  },
  {
    key: PERMISSION_KEYS.USERS_DISABLE,
    label: "Disable users",
    description: "Disable or reactivate staff accounts and revoke sessions.",
    group: "Users",
  },
  {
    key: PERMISSION_KEYS.USERS_ASSIGN_ROLES,
    label: "Assign user roles",
    description: "Replace a staff member's role assignments.",
    group: "Users",
  },
  {
    key: PERMISSION_KEYS.ROLES_READ,
    label: "Read roles",
    description: "View roles and their permission assignments.",
    group: "Roles",
  },
  {
    key: PERMISSION_KEYS.ROLES_CREATE,
    label: "Create roles",
    description: "Create custom staff roles.",
    group: "Roles",
  },
  {
    key: PERMISSION_KEYS.ROLES_UPDATE,
    label: "Update roles",
    description: "Update custom role names and descriptions.",
    group: "Roles",
  },
  {
    key: PERMISSION_KEYS.ROLES_ASSIGN_PERMISSIONS,
    label: "Assign role permissions",
    description: "Replace permissions assigned to configurable roles.",
    group: "Roles",
  },
  {
    key: PERMISSION_KEYS.AUDIT_READ,
    label: "Read audit logs",
    description: "View safe, read-only security audit history.",
    group: "Security",
  },
  {
    key: PERMISSION_KEYS.SESSIONS_READ_OWN,
    label: "Read own sessions",
    description: "View safe summaries of the current user's sessions.",
    group: "Security",
  },
  {
    key: PERMISSION_KEYS.SESSIONS_REVOKE_OWN,
    label: "Revoke own sessions",
    description: "Revoke the current user's other sessions.",
    group: "Security",
  },
  {
    key: PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_READ,
    label: "Read before-and-after projects",
    description: "View project records and managed project media.",
    group: "Projects",
  },
  {
    key: PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_CREATE,
    label: "Create before-and-after projects",
    description: "Create draft before-and-after projects.",
    group: "Projects",
  },
  {
    key: PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_UPDATE,
    label: "Update before-and-after projects",
    description: "Edit project content, associations, and media order.",
    group: "Projects",
  },
  {
    key: PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_PUBLISH,
    label: "Publish before-and-after projects",
    description: "Publish and unpublish portfolio projects and their media.",
    group: "Projects",
  },
  {
    key: PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_ARCHIVE,
    label: "Archive before-and-after projects",
    description: "Archive portfolio projects while preserving records and media.",
    group: "Projects",
  },
  {
    key: PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_DELETE,
    label: "Delete before-and-after projects",
    description: "Delete eligible draft projects after explicit confirmation.",
    group: "Projects",
  },
  {
    key: PERMISSION_KEYS.MEDIA_BEFORE_AFTER_UPLOAD,
    label: "Upload before-and-after media",
    description: "Upload and process private project images.",
    group: "Media",
  },
  {
    key: PERMISSION_KEYS.MEDIA_BEFORE_AFTER_READ,
    label: "Read before-and-after media",
    description: "Preview managed public and private project media.",
    group: "Media",
  },
  {
    key: PERMISSION_KEYS.MEDIA_BEFORE_AFTER_UPDATE,
    label: "Update before-and-after media",
    description: "Edit project-media alt text and captions.",
    group: "Media",
  },
  {
    key: PERMISSION_KEYS.MEDIA_BEFORE_AFTER_DELETE,
    label: "Delete before-and-after media",
    description: "Delete unreferenced managed project media and variants.",
    group: "Media",
  },
  {
    key: PERMISSION_KEYS.QUOTE_REQUESTS_READ,
    label: "Read quote requests",
    description: "View customer quote requests and their submitted details.",
    group: "Quote Requests",
  },
  {
    key: PERMISSION_KEYS.QUOTE_REQUESTS_UPDATE,
    label: "Update quote requests",
    description: "Update operational quote-request details.",
    group: "Quote Requests",
  },
  {
    key: PERMISSION_KEYS.QUOTE_REQUESTS_CHANGE_STATUS,
    label: "Change quote status",
    description: "Move quote requests through approved workflow states.",
    group: "Quote Requests",
  },
  {
    key: PERMISSION_KEYS.QUOTE_REQUESTS_ASSIGN,
    label: "Assign quote requests",
    description: "Assign or unassign quote requests to staff.",
    group: "Quote Requests",
  },
  {
    key: PERMISSION_KEYS.QUOTE_REQUESTS_ADD_INTERNAL_NOTES,
    label: "Add internal quote notes",
    description: "Add staff-only notes to quote requests.",
    group: "Quote Requests",
  },
  {
    key: PERMISSION_KEYS.QUOTE_REQUESTS_READ_PRIVATE_MEDIA,
    label: "Read private quote media",
    description: "View customer-uploaded private quote images.",
    group: "Quote Requests",
  },
  {
    key: PERMISSION_KEYS.QUOTE_REQUESTS_ARCHIVE,
    label: "Archive quote requests",
    description: "Archive completed quote requests while preserving history.",
    group: "Quote Requests",
  },
  {
    key: PERMISSION_KEYS.QUOTE_REQUESTS_DELETE,
    label: "Delete quote requests",
    description: "Permanently delete eligible quote requests after confirmation.",
    group: "Quote Requests",
  },
] as const;

export const ALL_PERMISSION_KEYS = PERMISSION_DEFINITIONS.map(({ key }) => key);
const permissionKeySet = new Set<string>(ALL_PERMISSION_KEYS);

export function isPermissionKey(value: string): value is PermissionKey {
  return permissionKeySet.has(value);
}

export function hasPermission(
  granted: ReadonlySet<string> | readonly string[],
  required: PermissionKey,
): boolean {
  return Array.isArray(granted)
    ? granted.includes(required)
    : (granted as ReadonlySet<string>).has(required);
}

export function hasEveryPermission(
  granted: ReadonlySet<string> | readonly string[],
  required: readonly PermissionKey[],
): boolean {
  return required.every((permission) => hasPermission(granted, permission));
}

export function combinePermissionKeys(groups: readonly (readonly string[])[]): PermissionKey[] {
  return [...new Set(groups.flat().filter(isPermissionKey))];
}
