import { z } from "zod";
export type { ZodType } from "zod";

const nodeEnvironmentSchema = z.enum(["development", "test", "production"]);
const portSchema = z.coerce.number().int().min(1).max(65_535);
const positiveSecondsSchema = z.coerce.number().int().positive();
const booleanEnvironmentSchema = z.enum(["true", "false"]).transform((value) => value === "true");
const positiveIntegerSchema = z.coerce.number().int().positive();
const httpUrlSchema = z
  .url()
  .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
    message: "Expected an HTTP or HTTPS URL",
  });

export const apiEnvironmentSchema = z
  .object({
    ADMIN_URL: httpUrlSchema,
    API_PORT: portSchema.default(4000),
    AUTH_ACTIVITY_UPDATE_SECONDS: positiveSecondsSchema.default(300),
    AUTH_COOKIE_SECURE: booleanEnvironmentSchema.default(false),
    AUTH_SESSION_ABSOLUTE_SECONDS: positiveSecondsSchema.min(3600).default(604_800),
    AUTH_SESSION_COOKIE_DOMAIN: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(3).max(253).optional(),
    ),
    AUTH_SESSION_COOKIE_NAME: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .default("ctps_admin_session"),
    AUTH_SESSION_IDLE_SECONDS: positiveSecondsSchema.min(900).default(28_800),
    AUTH_SESSION_CLEANUP_SECONDS: positiveSecondsSchema.min(60).default(3600),
    CORS_ALLOWED_ORIGINS: z
      .string()
      .min(1)
      .transform((value, context) => {
        const origins = value.split(",").map((origin) => origin.trim());

        for (const origin of origins) {
          const result = httpUrlSchema.safeParse(origin);
          if (!result.success) {
            context.addIssue({
              code: "custom",
              message: `Invalid CORS origin: ${origin}`,
            });
            return z.NEVER;
          }
        }

        return origins;
      }),
    DATABASE_URL: z.string().min(1).startsWith("postgresql://"),
    LOGIN_THROTTLE_MAX_ATTEMPTS: z.coerce.number().int().min(2).max(100).default(8),
    LOGIN_THROTTLE_WINDOW_SECONDS: positiveSecondsSchema.min(30).default(900),
    MEDIA_STORAGE_DRIVER: z.literal("local").default("local"),
    MEDIA_LOCAL_PUBLIC_ROOT: z.string().trim().min(1).default("../../storage/public/before-after"),
    MEDIA_LOCAL_PRIVATE_ROOT: z
      .string()
      .trim()
      .min(1)
      .default("../../storage/private/before-after"),
    MEDIA_MAX_FILE_BYTES: positiveIntegerSchema.max(25 * 1024 * 1024).default(10 * 1024 * 1024),
    MEDIA_MAX_UPLOAD_FILES: positiveIntegerSchema.max(20).default(10),
    MEDIA_MAX_PROJECT_SUPPORTING_IMAGES: positiveIntegerSchema.max(30).default(12),
    MEDIA_MAX_TOTAL_UPLOAD_BYTES: positiveIntegerSchema
      .max(100 * 1024 * 1024)
      .default(50 * 1024 * 1024),
    MEDIA_MIN_WIDTH: positiveIntegerSchema.max(4000).default(600),
    MEDIA_MIN_HEIGHT: positiveIntegerSchema.max(4000).default(400),
    MEDIA_MAX_WIDTH: positiveIntegerSchema.max(20000).default(12000),
    MEDIA_MAX_HEIGHT: positiveIntegerSchema.max(20000).default(12000),
    MEDIA_IMAGE_QUALITY: z.coerce.number().int().min(40).max(95).default(82),
    MEDIA_PUBLIC_BASE_PATH: z.string().trim().startsWith("/").default("/media/before-after"),
    NODE_ENV: nodeEnvironmentSchema.default("development"),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === "production" && !value.AUTH_COOKIE_SECURE) {
      context.addIssue({
        code: "custom",
        path: ["AUTH_COOKIE_SECURE"],
        message: "Secure authentication cookies are required in production",
      });
    }
    if (value.MEDIA_MAX_TOTAL_UPLOAD_BYTES < value.MEDIA_MAX_FILE_BYTES) {
      context.addIssue({
        code: "custom",
        path: ["MEDIA_MAX_TOTAL_UPLOAD_BYTES"],
        message: "Total media upload limit must be at least the per-file limit",
      });
    }
    if (
      value.MEDIA_MAX_WIDTH < value.MEDIA_MIN_WIDTH ||
      value.MEDIA_MAX_HEIGHT < value.MEDIA_MIN_HEIGHT
    ) {
      context.addIssue({
        code: "custom",
        path: ["MEDIA_MAX_WIDTH"],
        message: "Maximum media dimensions must exceed minimum dimensions",
      });
    }
  });

export const statusPageEnvironmentSchema = z.object({
  API_URL: httpUrlSchema,
  NODE_ENV: nodeEnvironmentSchema.default("development"),
});

export const apiHealthResponseSchema = z.object({
  success: z.literal(true),
  status: z.literal("ok"),
  service: z.literal("ctps-api"),
  timestamp: z.iso.datetime({ offset: true }),
});

export const databaseHealthResponseSchema = z.object({
  success: z.literal(true),
  status: z.literal("ready"),
  database: z.literal("connected"),
  timestamp: z.iso.datetime({ offset: true }),
});

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;
export type StatusPageEnvironment = z.infer<typeof statusPageEnvironmentSchema>;

export const normalizedEmailSchema = z
  .string()
  .trim()
  .pipe(z.email().max(254))
  .transform((value) => value.toLowerCase());

export const displayNameSchema = z.string().trim().min(2).max(100);
export const passwordSchema = z.string().min(12).max(128);
export const identifierSchema = z.uuid();
export const permissionKeySchema = z.string().min(3).max(100);

export const loginSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(1).max(128),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1).max(128),
  })
  .superRefine((value, context) => {
    if (value.newPassword !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
    if (value.currentPassword === value.newPassword) {
      context.addIssue({
        code: "custom",
        message: "New password must differ from the current password",
        path: ["newPassword"],
      });
    }
  });

export const createUserSchema = z.object({
  displayName: displayNameSchema,
  email: normalizedEmailSchema,
  roleIds: z.array(identifierSchema).max(20).default([]),
});

export const updateUserSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    email: normalizedEmailSchema.optional(),
  })
  .refine((value) => value.displayName !== undefined || value.email !== undefined, {
    message: "At least one field must be provided",
  });

export const assignRolesSchema = z.object({ roleIds: z.array(identifierSchema).max(20) });

export const createRoleSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[A-Z][A-Z0-9_]{2,63}$/),
  displayName: z.string().trim().min(2).max(100),
  description: z.string().trim().min(3).max(500),
});

export const updateRoleSchema = z
  .object({
    displayName: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().min(3).max(500).optional(),
  })
  .refine((value) => value.displayName !== undefined || value.description !== undefined, {
    message: "At least one field must be provided",
  });

export const assignPermissionsSchema = z.object({
  permissionKeys: z.array(permissionKeySchema).max(100),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const userListQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export const auditListQuerySchema = paginationSchema.extend({
  actorUserId: identifierSchema.optional(),
  action: z.string().trim().max(100).optional(),
  resourceType: z.string().trim().max(100).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});

export const beforeAfterServiceKeySchema = z.enum([
  "window-cleaning",
  "pressure-washing",
  "gutter-cleaning",
  "moss-removal",
  "vent-cleaning",
]);
export const beforeAfterServiceAreaKeySchema = z.enum([
  "vancouver",
  "richmond",
  "burnaby",
  "surrey",
  "coquitlam",
  "north-vancouver",
]);
export const beforeAfterStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const beforeAfterCategorySchema = z.enum(["BEFORE", "AFTER", "GALLERY"]);
export const beforeAfterSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .refine(
    (slug) => !["new", "admin", "api", "design-system"].includes(slug),
    "This slug is reserved",
  );
const optionalNullableDateSchema = z
  .union([z.iso.datetime({ offset: true }), z.literal(""), z.null()])
  .optional();
const beforeAfterSupportingMediaSchema = z
  .array(
    z.object({
      mediaId: identifierSchema,
      category: beforeAfterCategorySchema,
      sortOrder: z.number().int().min(0).max(100),
      caption: z.string().trim().max(500).optional().nullable(),
    }),
  )
  .max(12)
  .superRefine((items, context) => {
    if (new Set(items.map(({ mediaId }) => mediaId)).size !== items.length)
      context.addIssue({ code: "custom", message: "Supporting media identifiers must be unique" });
    if (new Set(items.map(({ sortOrder }) => sortOrder)).size !== items.length)
      context.addIssue({ code: "custom", message: "Supporting media positions must be unique" });
  });

export const createBeforeAfterProjectSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: beforeAfterSlugSchema,
  summary: z.string().trim().max(500).default(""),
  description: z.string().trim().max(10_000).default(""),
  serviceKey: beforeAfterServiceKeySchema,
  serviceAreaKey: beforeAfterServiceAreaKeySchema,
  completedAt: optionalNullableDateSchema,
  seoTitle: z.string().trim().max(70).optional().nullable(),
  seoDescription: z.string().trim().max(170).optional().nullable(),
  featured: z.boolean().default(false),
  primaryBeforeMediaId: identifierSchema.optional().nullable(),
  primaryAfterMediaId: identifierSchema.optional().nullable(),
  supportingMedia: beforeAfterSupportingMediaSchema.default([]),
});
export const updateBeforeAfterProjectSchema = createBeforeAfterProjectSchema
  .partial()
  .extend({ version: z.number().int().positive() })
  .refine((value) => Object.keys(value).length > 1, "At least one field must be updated");
export const beforeAfterProjectListQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  status: beforeAfterStatusSchema.optional(),
  serviceKey: beforeAfterServiceKeySchema.optional(),
  serviceAreaKey: beforeAfterServiceAreaKeySchema.optional(),
  featured: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});
export const publicBeforeAfterProjectListQuerySchema = paginationSchema.extend({
  pageSize: z.coerce.number().int().min(1).max(24).default(12),
  serviceKey: beforeAfterServiceKeySchema.optional(),
  serviceAreaKey: beforeAfterServiceAreaKeySchema.optional(),
  featured: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});
export const beforeAfterMediaUpdateSchema = z
  .object({
    altText: z.string().trim().max(300).optional(),
    caption: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (value) => value.altText !== undefined || value.caption !== undefined,
    "At least one field must be updated",
  );
export const beforeAfterMediaOrderSchema = z.object({
  version: z.number().int().positive(),
  items: beforeAfterSupportingMediaSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;
export type CreateBeforeAfterProjectInput = z.infer<typeof createBeforeAfterProjectSchema>;
export type UpdateBeforeAfterProjectInput = z.infer<typeof updateBeforeAfterProjectSchema>;
export type BeforeAfterMediaUpdateInput = z.infer<typeof beforeAfterMediaUpdateSchema>;
export type BeforeAfterMediaOrderInput = z.infer<typeof beforeAfterMediaOrderSchema>;
