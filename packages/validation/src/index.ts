import { z } from "zod";
export type { ZodType } from "zod";

const nodeEnvironmentSchema = z.enum(["development", "test", "production"]);
const portSchema = z.coerce.number().int().min(1).max(65_535);
const positiveSecondsSchema = z.coerce.number().int().positive();
const booleanEnvironmentSchema = z.enum(["true", "false"]).transform((value) => value === "true");
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

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;
