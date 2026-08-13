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
  PRICING_VERSIONS_READ: "pricingVersions.read",
  PRICING_VERSIONS_CREATE: "pricingVersions.create",
  PRICING_VERSIONS_UPDATE: "pricingVersions.update",
  PRICING_VERSIONS_PUBLISH: "pricingVersions.publish",
  PRICING_VERSIONS_ARCHIVE: "pricingVersions.archive",
  PRICING_VERSIONS_DELETE: "pricingVersions.delete",
  PRICING_RULES_READ: "pricingRules.read",
  PRICING_RULES_CREATE: "pricingRules.create",
  PRICING_RULES_UPDATE: "pricingRules.update",
  PRICING_RULES_DELETE: "pricingRules.delete",
  ESTIMATOR_RESULTS_READ: "estimatorResults.read",
  ESTIMATOR_RESULTS_READ_CALCULATION_TRACE: "estimatorResults.readCalculationTrace",
  ESTIMATOR_RESULTS_ARCHIVE: "estimatorResults.archive",
  BLOG_POSTS_READ_OWN: "blogPosts.readOwn",
  BLOG_POSTS_READ_ALL: "blogPosts.readAll",
  BLOG_POSTS_CREATE: "blogPosts.create",
  BLOG_POSTS_UPDATE_OWN: "blogPosts.updateOwn",
  BLOG_POSTS_UPDATE_ALL: "blogPosts.updateAll",
  BLOG_POSTS_PUBLISH_OWN: "blogPosts.publishOwn",
  BLOG_POSTS_PUBLISH_ALL: "blogPosts.publishAll",
  BLOG_POSTS_SCHEDULE_OWN: "blogPosts.scheduleOwn",
  BLOG_POSTS_SCHEDULE_ALL: "blogPosts.scheduleAll",
  BLOG_POSTS_ARCHIVE_OWN: "blogPosts.archiveOwn",
  BLOG_POSTS_ARCHIVE_ALL: "blogPosts.archiveAll",
  BLOG_POSTS_DELETE_OWN: "blogPosts.deleteOwn",
  BLOG_POSTS_DELETE_ALL: "blogPosts.deleteAll",
  BLOG_MEDIA_UPLOAD_OWN: "blogMedia.uploadOwn",
  BLOG_MEDIA_READ_OWN: "blogMedia.readOwn",
  BLOG_MEDIA_READ_ALL: "blogMedia.readAll",
  BLOG_MEDIA_UPDATE_OWN: "blogMedia.updateOwn",
  BLOG_MEDIA_UPDATE_ALL: "blogMedia.updateAll",
  BLOG_MEDIA_DELETE_OWN: "blogMedia.deleteOwn",
  BLOG_MEDIA_DELETE_ALL: "blogMedia.deleteAll",
  BLOG_CATEGORIES_READ: "blogCategories.read",
  BLOG_CATEGORIES_MANAGE: "blogCategories.manage",
  BLOG_TAGS_READ: "blogTags.read",
  BLOG_TAGS_MANAGE: "blogTags.manage",
  AUTHOR_PROFILES_READ: "authorProfiles.read",
  AUTHOR_PROFILES_UPDATE_OWN: "authorProfiles.updateOwn",
  AUTHOR_PROFILES_UPDATE_ALL: "authorProfiles.updateAll",
  BLOG_REVISIONS_READ_OWN: "blogRevisions.readOwn",
  BLOG_REVISIONS_READ_ALL: "blogRevisions.readAll",
  BLOG_REVISIONS_RESTORE_OWN: "blogRevisions.restoreOwn",
  BLOG_REVISIONS_RESTORE_ALL: "blogRevisions.restoreAll",
  JOBS_READ: "jobs.read",
  JOBS_READ_ASSIGNED: "jobs.readAssigned",
  JOBS_CREATE_FROM_QUOTE: "jobs.createFromQuote",
  JOBS_CREATE_INTERNAL: "jobs.createInternal",
  JOBS_UPDATE: "jobs.update",
  JOBS_SCHEDULE: "jobs.schedule",
  JOBS_RESCHEDULE: "jobs.reschedule",
  JOBS_ASSIGN: "jobs.assign",
  JOBS_CHANGE_STATUS: "jobs.changeStatus",
  JOBS_CANCEL: "jobs.cancel",
  JOBS_COMPLETE: "jobs.complete",
  JOBS_CLOSE: "jobs.close",
  JOBS_ARCHIVE: "jobs.archive",
  JOBS_DELETE: "jobs.delete",
  JOBS_ADD_INTERNAL_NOTES: "jobs.addInternalNotes",
  JOBS_MANAGE_CHECKLIST: "jobs.manageChecklist",
  JOBS_READ_PRIVATE_MEDIA: "jobs.readPrivateMedia",
  JOBS_UPLOAD_PRIVATE_MEDIA: "jobs.uploadPrivateMedia",
  JOBS_DELETE_PRIVATE_MEDIA: "jobs.deletePrivateMedia",
  JOBS_MANAGE_INCIDENTS: "jobs.manageIncidents",
  JOBS_VIEW_CALENDAR: "jobs.viewCalendar",
  JOBS_MANAGE_CUSTOMER_NOTIFICATIONS: "jobs.manageCustomerNotifications",
  JOBS_OVERRIDE_CONFLICTS: "jobs.overrideConflicts",
  JOBS_OVERRIDE_COMPLETION: "jobs.overrideCompletion",
  PAGES_READ: "pages.read",
  PAGES_UPDATE: "pages.update",
  PAGES_PUBLISH: "pages.publish",
  PAGES_PREVIEW: "pages.preview",
  PAGES_MANAGE_SEO: "pages.manageSeo",
  NAVIGATION_READ: "navigation.read",
  NAVIGATION_UPDATE: "navigation.update",
  SITE_SETTINGS_READ: "siteSettings.read",
  SITE_SETTINGS_UPDATE: "siteSettings.update",
  MEDIA_LIBRARY_READ: "mediaLibrary.read",
  MEDIA_LIBRARY_UPLOAD: "mediaLibrary.upload",
  MEDIA_LIBRARY_UPDATE: "mediaLibrary.update",
  MEDIA_LIBRARY_ARCHIVE: "mediaLibrary.archive",
  MEDIA_LIBRARY_RESTORE: "mediaLibrary.restore",
  MEDIA_LIBRARY_DELETE: "mediaLibrary.delete",
  SEO_VIEW: "seo.view",
} as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];
export type PermissionGroup =
  | "Administration"
  | "Users"
  | "Roles"
  | "Security"
  | "Projects"
  | "Media"
  | "Quote Requests"
  | "Pricing"
  | "Estimator Results"
  | "Blog Posts"
  | "Blog Media"
  | "Blog Taxonomy"
  | "Authors"
  | "Blog Revisions"
  | "Jobs"
  | "Website Pages"
  | "Website Navigation"
  | "Site Settings"
  | "Media Library"
  | "SEO";

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
  ...(
    [
      [
        PERMISSION_KEYS.PRICING_VERSIONS_READ,
        "Read pricing versions",
        "View pricing versions and service configurations.",
      ],
      [
        PERMISSION_KEYS.PRICING_VERSIONS_CREATE,
        "Create pricing versions",
        "Create or clone draft pricing versions.",
      ],
      [
        PERMISSION_KEYS.PRICING_VERSIONS_UPDATE,
        "Update pricing versions",
        "Edit draft pricing versions and service configuration.",
      ],
      [
        PERMISSION_KEYS.PRICING_VERSIONS_PUBLISH,
        "Publish pricing versions",
        "Validate and publish an effective pricing version.",
      ],
      [
        PERMISSION_KEYS.PRICING_VERSIONS_ARCHIVE,
        "Archive pricing versions",
        "Archive superseded pricing versions without changing history.",
      ],
      [
        PERMISSION_KEYS.PRICING_VERSIONS_DELETE,
        "Delete pricing drafts",
        "Delete eligible unreferenced draft pricing versions.",
      ],
      [PERMISSION_KEYS.PRICING_RULES_READ, "Read pricing rules", "View structured pricing rules."],
      [
        PERMISSION_KEYS.PRICING_RULES_CREATE,
        "Create pricing rules",
        "Add structured rules to draft pricing versions.",
      ],
      [
        PERMISSION_KEYS.PRICING_RULES_UPDATE,
        "Update pricing rules",
        "Edit structured rules on draft pricing versions.",
      ],
      [
        PERMISSION_KEYS.PRICING_RULES_DELETE,
        "Delete pricing rules",
        "Delete structured rules from draft pricing versions.",
      ],
    ] as const
  ).map(([key, label, description]) => ({ key, label, description, group: "Pricing" as const })),
  ...(
    [
      [
        PERMISSION_KEYS.ESTIMATOR_RESULTS_READ,
        "Read estimator results",
        "View safe preliminary estimate records.",
      ],
      [
        PERMISSION_KEYS.ESTIMATOR_RESULTS_READ_CALCULATION_TRACE,
        "Read calculation traces",
        "View internal pricing calculation traces.",
      ],
      [
        PERMISSION_KEYS.ESTIMATOR_RESULTS_ARCHIVE,
        "Archive estimator results",
        "Archive estimator result records.",
      ],
    ] as const
  ).map(([key, label, description]) => ({
    key,
    label,
    description,
    group: "Estimator Results" as const,
  })),
  ...(
    [
      [
        PERMISSION_KEYS.BLOG_POSTS_READ_OWN,
        "Read own blog posts",
        "View blog posts owned by the current author.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_READ_ALL,
        "Read all blog posts",
        "View posts owned by any author.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_CREATE,
        "Create blog posts",
        "Create a new owned Draft blog post.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_UPDATE_OWN,
        "Update own blog posts",
        "Edit owned blog posts and structured content.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_UPDATE_ALL,
        "Update all blog posts",
        "Edit posts owned by any author.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_PUBLISH_OWN,
        "Publish own blog posts",
        "Publish or unpublish an owned post.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_PUBLISH_ALL,
        "Publish all blog posts",
        "Publish or unpublish posts owned by any author.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_SCHEDULE_OWN,
        "Schedule own blog posts",
        "Schedule an owned post for durable publication.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_SCHEDULE_ALL,
        "Schedule all blog posts",
        "Schedule posts owned by any author.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_ARCHIVE_OWN,
        "Archive own blog posts",
        "Archive an owned blog post.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_ARCHIVE_ALL,
        "Archive all blog posts",
        "Archive posts owned by any author.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_DELETE_OWN,
        "Delete own blog drafts",
        "Delete an eligible owned Draft post.",
      ],
      [
        PERMISSION_KEYS.BLOG_POSTS_DELETE_ALL,
        "Delete all blog drafts",
        "Delete eligible Draft posts owned by any author.",
      ],
    ] as const
  ).map(([key, label, description]) => ({ key, label, description, group: "Blog Posts" as const })),
  ...(
    [
      [
        PERMISSION_KEYS.BLOG_MEDIA_UPLOAD_OWN,
        "Upload own blog media",
        "Upload managed images for owned blog content.",
      ],
      [
        PERMISSION_KEYS.BLOG_MEDIA_READ_OWN,
        "Read own blog media",
        "Preview blog media uploaded by the current author.",
      ],
      [
        PERMISSION_KEYS.BLOG_MEDIA_READ_ALL,
        "Read all blog media",
        "Preview blog media uploaded by any author.",
      ],
      [
        PERMISSION_KEYS.BLOG_MEDIA_UPDATE_OWN,
        "Update own blog media",
        "Edit alt text and captions on owned blog media.",
      ],
      [
        PERMISSION_KEYS.BLOG_MEDIA_UPDATE_ALL,
        "Update all blog media",
        "Edit blog media owned by any author.",
      ],
      [
        PERMISSION_KEYS.BLOG_MEDIA_DELETE_OWN,
        "Delete own blog media",
        "Delete unreferenced owned blog media.",
      ],
      [
        PERMISSION_KEYS.BLOG_MEDIA_DELETE_ALL,
        "Delete all blog media",
        "Delete unreferenced blog media owned by any author.",
      ],
    ] as const
  ).map(([key, label, description]) => ({ key, label, description, group: "Blog Media" as const })),
  ...(
    [
      [
        PERMISSION_KEYS.BLOG_CATEGORIES_READ,
        "Read blog categories",
        "View and select curated blog categories.",
      ],
      [
        PERMISSION_KEYS.BLOG_CATEGORIES_MANAGE,
        "Manage blog categories",
        "Create, update, and safely delete blog categories.",
      ],
      [PERMISSION_KEYS.BLOG_TAGS_READ, "Read blog tags", "View and select controlled blog tags."],
      [
        PERMISSION_KEYS.BLOG_TAGS_MANAGE,
        "Manage blog tags",
        "Create, update, and safely delete blog tags.",
      ],
    ] as const
  ).map(([key, label, description]) => ({
    key,
    label,
    description,
    group: "Blog Taxonomy" as const,
  })),
  ...(
    [
      [
        PERMISSION_KEYS.AUTHOR_PROFILES_READ,
        "Read author profiles",
        "View public blog-author profile fields.",
      ],
      [
        PERMISSION_KEYS.AUTHOR_PROFILES_UPDATE_OWN,
        "Update own author profile",
        "Edit the current author's public profile.",
      ],
      [
        PERMISSION_KEYS.AUTHOR_PROFILES_UPDATE_ALL,
        "Update all author profiles",
        "Edit public profiles for any blog author.",
      ],
    ] as const
  ).map(([key, label, description]) => ({ key, label, description, group: "Authors" as const })),
  ...(
    [
      [
        PERMISSION_KEYS.BLOG_REVISIONS_READ_OWN,
        "Read own blog revisions",
        "View revision history for owned posts.",
      ],
      [
        PERMISSION_KEYS.BLOG_REVISIONS_READ_ALL,
        "Read all blog revisions",
        "View revision history for any post.",
      ],
      [
        PERMISSION_KEYS.BLOG_REVISIONS_RESTORE_OWN,
        "Restore own blog revisions",
        "Restore an owned revision into a new Draft revision.",
      ],
      [
        PERMISSION_KEYS.BLOG_REVISIONS_RESTORE_ALL,
        "Restore all blog revisions",
        "Restore revisions for posts owned by any author.",
      ],
    ] as const
  ).map(([key, label, description]) => ({
    key,
    label,
    description,
    group: "Blog Revisions" as const,
  })),
  ...(
    [
      [PERMISSION_KEYS.JOBS_READ, "Read jobs", "View all permitted operational jobs."],
      [
        PERMISSION_KEYS.JOBS_READ_ASSIGNED,
        "Read assigned jobs",
        "View jobs actively assigned to the current user.",
      ],
      [
        PERMISSION_KEYS.JOBS_CREATE_FROM_QUOTE,
        "Create jobs from quotes",
        "Convert an eligible accepted quote into one operational job.",
      ],
      [
        PERMISSION_KEYS.JOBS_CREATE_INTERNAL,
        "Create internal jobs",
        "Create a staff-entered job without fabricating a quote request.",
      ],
      [
        PERMISSION_KEYS.JOBS_UPDATE,
        "Update jobs",
        "Edit operational scope and approved job snapshots.",
      ],
      [PERMISSION_KEYS.JOBS_SCHEDULE, "Schedule jobs", "Record the initial appointment schedule."],
      [
        PERMISSION_KEYS.JOBS_RESCHEDULE,
        "Reschedule jobs",
        "Change an appointment while preserving schedule history.",
      ],
      [
        PERMISSION_KEYS.JOBS_ASSIGN,
        "Assign jobs",
        "Manage lead, crew, and coordinator assignments.",
      ],
      [
        PERMISSION_KEYS.JOBS_CHANGE_STATUS,
        "Change job status",
        "Perform approved operational lifecycle transitions.",
      ],
      [PERMISSION_KEYS.JOBS_CANCEL, "Cancel jobs", "Cancel a job with a recorded reason."],
      [
        PERMISSION_KEYS.JOBS_COMPLETE,
        "Complete jobs",
        "Complete jobs after checklist, incident, and summary validation.",
      ],
      [PERMISSION_KEYS.JOBS_CLOSE, "Close jobs", "Close completed operational records."],
      [PERMISSION_KEYS.JOBS_ARCHIVE, "Archive jobs", "Archive terminal operational records."],
      [
        PERMISSION_KEYS.JOBS_DELETE,
        "Delete eligible jobs",
        "Hard-delete only eligible Draft or Archived jobs.",
      ],
      [
        PERMISSION_KEYS.JOBS_ADD_INTERNAL_NOTES,
        "Add job notes",
        "Manage staff-only operational notes.",
      ],
      [
        PERMISSION_KEYS.JOBS_MANAGE_CHECKLIST,
        "Manage job checklists",
        "Create, order, and complete operational checklist items.",
      ],
      [
        PERMISSION_KEYS.JOBS_READ_PRIVATE_MEDIA,
        "Read private job media",
        "View permission-protected operational photos.",
      ],
      [
        PERMISSION_KEYS.JOBS_UPLOAD_PRIVATE_MEDIA,
        "Upload private job media",
        "Upload and process private operational photos.",
      ],
      [
        PERMISSION_KEYS.JOBS_DELETE_PRIVATE_MEDIA,
        "Delete private job media",
        "Remove private operational photos safely.",
      ],
      [
        PERMISSION_KEYS.JOBS_MANAGE_INCIDENTS,
        "Manage job incidents",
        "Record and resolve operational incidents.",
      ],
      [
        PERMISSION_KEYS.JOBS_VIEW_CALENDAR,
        "View job calendar",
        "View protected day, week, and agenda schedules.",
      ],
      [
        PERMISSION_KEYS.JOBS_MANAGE_CUSTOMER_NOTIFICATIONS,
        "Manage job notifications",
        "Queue approved customer scheduling notifications.",
      ],
      [
        PERMISSION_KEYS.JOBS_OVERRIDE_CONFLICTS,
        "Override scheduling conflicts",
        "Override a detected staff conflict with a written reason.",
      ],
      [
        PERMISSION_KEYS.JOBS_OVERRIDE_COMPLETION,
        "Override completion requirements",
        "Complete a job despite a blocking prerequisite with a written reason.",
      ],
    ] as const
  ).map(([key, label, description]) => ({ key, label, description, group: "Jobs" as const })),
  ...(
    [
      [
        PERMISSION_KEYS.PAGES_READ,
        "Read marketing pages",
        "View controlled marketing pages and revisions.",
      ],
      [
        PERMISSION_KEYS.PAGES_UPDATE,
        "Update marketing pages",
        "Save validated marketing-page drafts and section order.",
      ],
      [
        PERMISSION_KEYS.PAGES_PUBLISH,
        "Publish marketing pages",
        "Publish or restore controlled marketing-page revisions.",
      ],
      [
        PERMISSION_KEYS.PAGES_PREVIEW,
        "Preview marketing pages",
        "Preview authenticated marketing-page drafts.",
      ],
      [
        PERMISSION_KEYS.PAGES_MANAGE_SEO,
        "Manage page SEO",
        "Edit controlled page metadata and social images.",
      ],
    ] as const
  ).map(([key, label, description]) => ({
    key,
    label,
    description,
    group: "Website Pages" as const,
  })),
  ...(
    [
      [
        PERMISSION_KEYS.NAVIGATION_READ,
        "Read website navigation",
        "View controlled public navigation items.",
      ],
      [
        PERMISSION_KEYS.NAVIGATION_UPDATE,
        "Update website navigation",
        "Edit labels, visibility, and order for approved destinations.",
      ],
    ] as const
  ).map(([key, label, description]) => ({
    key,
    label,
    description,
    group: "Website Navigation" as const,
  })),
  ...(
    [
      [
        PERMISSION_KEYS.SITE_SETTINGS_READ,
        "Read site settings",
        "View controlled public brand and contact settings.",
      ],
      [
        PERMISSION_KEYS.SITE_SETTINGS_UPDATE,
        "Update site settings",
        "Edit validated public site settings without executable content.",
      ],
    ] as const
  ).map(([key, label, description]) => ({
    key,
    label,
    description,
    group: "Site Settings" as const,
  })),
  ...(
    [
      [
        PERMISSION_KEYS.MEDIA_LIBRARY_READ,
        "Read public media library",
        "View approved reusable public marketing media.",
      ],
      [
        PERMISSION_KEYS.MEDIA_LIBRARY_UPLOAD,
        "Upload public media",
        "Upload and process public marketing images.",
      ],
      [
        PERMISSION_KEYS.MEDIA_LIBRARY_UPDATE,
        "Update public media",
        "Edit public media metadata and focal points.",
      ],
      [
        PERMISSION_KEYS.MEDIA_LIBRARY_ARCHIVE,
        "Archive public media",
        "Hide public media from new selections without breaking existing published references.",
      ],
      [
        PERMISSION_KEYS.MEDIA_LIBRARY_RESTORE,
        "Restore public media",
        "Return archived public media to the active picker catalogue.",
      ],
      [
        PERMISSION_KEYS.MEDIA_LIBRARY_DELETE,
        "Delete public media",
        "Archive or delete unreferenced public marketing media.",
      ],
    ] as const
  ).map(([key, label, description]) => ({
    key,
    label,
    description,
    group: "Media Library" as const,
  })),
  {
    key: PERMISSION_KEYS.SEO_VIEW,
    label: "View SEO readiness",
    description: "View deterministic public-content SEO audits and readiness findings.",
    group: "SEO",
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
