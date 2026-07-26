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
    WEB_URL: httpUrlSchema,
    QUOTE_PRIVATE_MEDIA_ROOT: z
      .string()
      .trim()
      .min(1)
      .default("../../storage/private/quote-requests"),
    QUOTE_DRAFT_TTL_SECONDS: positiveSecondsSchema.min(900).default(86_400),
    QUOTE_MIN_COMPLETION_SECONDS: positiveSecondsSchema.min(1).max(3600).default(8),
    QUOTE_RATE_LIMIT_MAX_ATTEMPTS: positiveIntegerSchema.max(100).default(12),
    QUOTE_RATE_LIMIT_WINDOW_SECONDS: positiveSecondsSchema.min(30).default(900),
    ESTIMATOR_RESULT_TTL_SECONDS: positiveSecondsSchema.min(300).default(604_800),
    ESTIMATOR_TRANSFER_TTL_SECONDS: positiveSecondsSchema.min(60).default(1_800),
    ESTIMATOR_RATE_LIMIT_MAX_ATTEMPTS: positiveIntegerSchema.max(100).default(20),
    ESTIMATOR_RATE_LIMIT_WINDOW_SECONDS: positiveSecondsSchema.min(30).default(900),
    BLOG_ENABLED: booleanEnvironmentSchema.default(true),
    BLOG_LOCAL_PUBLIC_ROOT: z.string().trim().min(1).default("../../storage/public/blog"),
    BLOG_LOCAL_PRIVATE_ROOT: z.string().trim().min(1).default("../../storage/private/blog"),
    BLOG_MAX_UPLOAD_FILES: positiveIntegerSchema.max(20).default(10),
    BLOG_MAX_FILE_BYTES: positiveIntegerSchema.max(25 * 1024 * 1024).default(10 * 1024 * 1024),
    BLOG_MAX_TOTAL_UPLOAD_BYTES: positiveIntegerSchema
      .max(100 * 1024 * 1024)
      .default(50 * 1024 * 1024),
    BLOG_MIN_IMAGE_WIDTH: positiveIntegerSchema.max(4000).default(600),
    BLOG_MIN_IMAGE_HEIGHT: positiveIntegerSchema.max(4000).default(400),
    BLOG_MAX_IMAGE_WIDTH: positiveIntegerSchema.max(20000).default(12000),
    BLOG_MAX_IMAGE_HEIGHT: positiveIntegerSchema.max(20000).default(12000),
    BLOG_IMAGE_QUALITY: z.coerce.number().int().min(40).max(95).default(82),
    BLOG_SCHEDULE_BATCH_SIZE: positiveIntegerSchema.max(100).default(20),
    BLOG_SEARCH_MAX_QUERY_LENGTH: positiveIntegerSchema.max(200).default(100),
    BLOG_PUBLIC_PAGE_SIZE: positiveIntegerSchema.max(50).default(12),
    BLOG_ADMIN_PAGE_SIZE: positiveIntegerSchema.max(100).default(20),
    JOBS_ENABLED: booleanEnvironmentSchema.default(true),
    JOBS_TIME_ZONE: z.literal("America/Vancouver").default("America/Vancouver"),
    JOBS_DEFAULT_DURATION_MINUTES: positiveIntegerSchema.max(1440).default(180),
    JOBS_MIN_DURATION_MINUTES: positiveIntegerSchema.max(1440).default(30),
    JOBS_MAX_DURATION_MINUTES: positiveIntegerSchema.max(2880).default(960),
    JOBS_ADMIN_PAGE_SIZE: positiveIntegerSchema.max(100).default(20),
    JOBS_CALENDAR_RANGE_DAYS: positiveIntegerSchema.max(93).default(42),
    JOBS_PRIVATE_MEDIA_ROOT: z.string().trim().min(1).default("../../storage/private/jobs"),
    JOBS_MAX_UPLOAD_FILES: positiveIntegerSchema.max(20).default(10),
    JOBS_MAX_FILE_BYTES: positiveIntegerSchema.max(25 * 1024 * 1024).default(10 * 1024 * 1024),
    JOBS_MAX_TOTAL_UPLOAD_BYTES: positiveIntegerSchema
      .max(100 * 1024 * 1024)
      .default(50 * 1024 * 1024),
    JOBS_MIN_IMAGE_WIDTH: positiveIntegerSchema.max(4000).default(600),
    JOBS_MIN_IMAGE_HEIGHT: positiveIntegerSchema.max(4000).default(400),
    JOBS_MAX_IMAGE_WIDTH: positiveIntegerSchema.max(20000).default(12000),
    JOBS_MAX_IMAGE_HEIGHT: positiveIntegerSchema.max(20000).default(12000),
    JOBS_IMAGE_QUALITY: z.coerce.number().int().min(40).max(95).default(82),
    JOBS_REFERENCE_PREFIX: z.literal("JOB").default("JOB"),
    JOBS_REMINDER_HOURS_BEFORE: positiveIntegerSchema.max(168).default(24),
    JOBS_REMINDER_BATCH_SIZE: positiveIntegerSchema.max(100).default(25),
    QUOTE_MAX_UPLOAD_FILES: positiveIntegerSchema.max(20).default(8),
    QUOTE_MAX_FILE_BYTES: positiveIntegerSchema.max(25 * 1024 * 1024).default(8 * 1024 * 1024),
    QUOTE_MAX_TOTAL_UPLOAD_BYTES: positiveIntegerSchema
      .max(100 * 1024 * 1024)
      .default(32 * 1024 * 1024),
    EMAIL_DELIVERY_MODE: z.enum(["smtp", "log-safe", "disabled"]).default("log-safe"),
    EMAIL_FROM: z.string().trim().pipe(z.email().max(254)).default("quotes@example.invalid"),
    QUOTE_STAFF_EMAIL: z.string().trim().pipe(z.email().max(254)).default("quotes@example.invalid"),
    SMTP_HOST: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().trim().min(1).optional(),
    ),
    SMTP_PORT: portSchema.default(587),
    SMTP_SECURE: booleanEnvironmentSchema.default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
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
    if (value.QUOTE_MAX_TOTAL_UPLOAD_BYTES < value.QUOTE_MAX_FILE_BYTES) {
      context.addIssue({
        code: "custom",
        path: ["QUOTE_MAX_TOTAL_UPLOAD_BYTES"],
        message: "Total quote upload limit must be at least the per-file limit",
      });
    }
    if (value.BLOG_MAX_TOTAL_UPLOAD_BYTES < value.BLOG_MAX_FILE_BYTES) {
      context.addIssue({
        code: "custom",
        path: ["BLOG_MAX_TOTAL_UPLOAD_BYTES"],
        message: "Total blog upload limit must be at least the per-file limit",
      });
    }
    if (value.JOBS_MAX_TOTAL_UPLOAD_BYTES < value.JOBS_MAX_FILE_BYTES) {
      context.addIssue({
        code: "custom",
        path: ["JOBS_MAX_TOTAL_UPLOAD_BYTES"],
        message: "Total job-media upload limit must be at least the per-file limit",
      });
    }
    if (value.JOBS_MAX_DURATION_MINUTES < value.JOBS_MIN_DURATION_MINUTES) {
      context.addIssue({
        code: "custom",
        path: ["JOBS_MAX_DURATION_MINUTES"],
        message: "Maximum job duration must exceed minimum duration",
      });
    }
    if (
      value.JOBS_MAX_IMAGE_WIDTH < value.JOBS_MIN_IMAGE_WIDTH ||
      value.JOBS_MAX_IMAGE_HEIGHT < value.JOBS_MIN_IMAGE_HEIGHT
    ) {
      context.addIssue({
        code: "custom",
        path: ["JOBS_MAX_IMAGE_WIDTH"],
        message: "Maximum job-image dimensions must exceed minimum dimensions",
      });
    }
    if (
      value.BLOG_MAX_IMAGE_WIDTH < value.BLOG_MIN_IMAGE_WIDTH ||
      value.BLOG_MAX_IMAGE_HEIGHT < value.BLOG_MIN_IMAGE_HEIGHT
    ) {
      context.addIssue({
        code: "custom",
        path: ["BLOG_MAX_IMAGE_WIDTH"],
        message: "Maximum blog image dimensions must exceed minimum dimensions",
      });
    }
    if (value.EMAIL_DELIVERY_MODE === "smtp" && !value.SMTP_HOST) {
      context.addIssue({
        code: "custom",
        path: ["SMTP_HOST"],
        message: "SMTP_HOST is required in SMTP mode",
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

export const QUOTE_SERVICE_DEFINITIONS = [
  {
    key: "window-cleaning",
    label: "Window cleaning",
    questions: [
      { key: "storeys", label: "How many storeys?", type: "number", required: true },
      { key: "interior", label: "Include interior windows?", type: "boolean", required: true },
    ],
  },
  {
    key: "pressure-washing",
    label: "Pressure washing",
    questions: [
      { key: "surfaces", label: "Which surfaces need cleaning?", type: "text", required: true },
      {
        key: "approximateArea",
        label: "Approximate area (sq. ft.)",
        type: "number",
        required: false,
      },
    ],
  },
  {
    key: "gutter-cleaning",
    label: "Gutter cleaning",
    questions: [{ key: "storeys", label: "How many storeys?", type: "number", required: true }],
  },
  {
    key: "moss-removal",
    label: "Moss removal",
    questions: [
      { key: "roofType", label: "What type of roof is it?", type: "text", required: true },
    ],
  },
  {
    key: "vent-cleaning",
    label: "Vent cleaning",
    questions: [
      {
        key: "ventType",
        label: "Which vent type?",
        type: "select",
        required: true,
        options: ["dryer", "bathroom-exhaust", "hvac-duct", "commercial"],
      },
      { key: "ventCount", label: "How many vents?", type: "number", required: true },
    ],
  },
] as const;

export const QUOTE_SERVICE_AREA_DEFINITIONS = [
  { key: "vancouver", label: "Vancouver" },
  { key: "richmond", label: "Richmond" },
  { key: "burnaby", label: "Burnaby" },
  { key: "surrey", label: "Surrey" },
  { key: "coquitlam", label: "Coquitlam" },
  { key: "north-vancouver", label: "North Vancouver" },
] as const;

export const quoteServiceKeySchema = z.enum(
  QUOTE_SERVICE_DEFINITIONS.map(({ key }) => key) as [
    (typeof QUOTE_SERVICE_DEFINITIONS)[number]["key"],
    ...(typeof QUOTE_SERVICE_DEFINITIONS)[number]["key"][],
  ],
);
export const quoteServiceAreaKeySchema = z.enum(
  QUOTE_SERVICE_AREA_DEFINITIONS.map(({ key }) => key) as [
    (typeof QUOTE_SERVICE_AREA_DEFINITIONS)[number]["key"],
    ...(typeof QUOTE_SERVICE_AREA_DEFINITIONS)[number]["key"][],
  ],
);
export const quoteStatusSchema = z.enum([
  "NEW",
  "UNDER_REVIEW",
  "MORE_INFORMATION_REQUIRED",
  "ESTIMATE_REVIEWED",
  "QUOTE_PREPARED",
  "CONTACTED",
  "ACCEPTED",
  "DECLINED",
  "CLOSED",
  "CANCELLED",
]);
const safeText = (maximum: number) => z.string().trim().max(maximum);
export const quoteDraftCreateSchema = z.object({ honeypot: z.string().max(0).default("") });
export const quoteSubmissionSchema = z
  .object({
    draftToken: z.string().min(43).max(200),
    idempotencyKey: z.uuid(),
    estimateTransferToken: z.string().min(43).max(200).optional(),
    honeypot: z.string().max(0).default(""),
    propertyType: z.enum(["RESIDENTIAL", "COMMERCIAL"]),
    services: z.array(quoteServiceKeySchema).min(1).max(5),
    serviceAnswers: z.record(
      z.string().max(64),
      z.record(z.string().max(64), z.union([z.string().max(500), z.number(), z.boolean()])),
    ),
    propertyDetails: z.object({
      accessNotes: safeText(1000).optional(),
      approximateSize: safeText(100).optional(),
    }),
    address: z.object({
      line1: safeText(160).min(3),
      line2: safeText(160).optional(),
      city: safeText(80).min(2),
      province: z.literal("British Columbia"),
      postalCode: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/),
      serviceAreaKey: quoteServiceAreaKeySchema,
    }),
    preferredDates: z.array(z.iso.date()).max(3).default([]),
    notes: safeText(3000).optional(),
    contact: z.object({
      fullName: safeText(120).min(2),
      email: normalizedEmailSchema,
      phone: z
        .string()
        .trim()
        .min(7)
        .max(32)
        .regex(/^[+()\- .0-9]+$/),
      preferredMethod: z.enum(["EMAIL", "PHONE", "TEXT"]),
      companyName: safeText(160).optional(),
    }),
    consent: z.literal(true),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.services).size !== value.services.length)
      context.addIssue({ code: "custom", path: ["services"], message: "Services must be unique" });
    for (const serviceKey of value.services) {
      const definition = QUOTE_SERVICE_DEFINITIONS.find(({ key }) => key === serviceKey)!;
      const answers = value.serviceAnswers[serviceKey] ?? {};
      for (const question of definition.questions) {
        const answer = answers[question.key];
        if (question.required && (answer === undefined || answer === ""))
          context.addIssue({
            code: "custom",
            path: ["serviceAnswers", serviceKey, question.key],
            message: `${question.label} is required`,
          });
        if (
          answer !== undefined &&
          question.type === "number" &&
          (typeof answer !== "number" || !Number.isFinite(answer) || answer < 0)
        )
          context.addIssue({
            code: "custom",
            path: ["serviceAnswers", serviceKey, question.key],
            message: "Enter a valid number",
          });
        if (answer !== undefined && question.type === "boolean" && typeof answer !== "boolean")
          context.addIssue({
            code: "custom",
            path: ["serviceAnswers", serviceKey, question.key],
            message: "Choose yes or no",
          });
        if (
          answer !== undefined &&
          question.type === "select" &&
          !(question.options as readonly unknown[]).includes(answer)
        )
          context.addIssue({
            code: "custom",
            path: ["serviceAnswers", serviceKey, question.key],
            message: "Choose an approved option",
          });
      }
    }
    const area = QUOTE_SERVICE_AREA_DEFINITIONS.find(
      ({ key }) => key === value.address.serviceAreaKey,
    );
    if (!area || area.label.toLowerCase() !== value.address.city.trim().toLowerCase())
      context.addIssue({
        code: "custom",
        path: ["address", "city"],
        message: "City must match the approved service area",
      });
    const today = new Date().toISOString().slice(0, 10);
    for (const [index, date] of value.preferredDates.entries())
      if (date < today)
        context.addIssue({
          code: "custom",
          path: ["preferredDates", index],
          message: "Preferred dates cannot be in the past",
        });
  });

export const estimatorServiceKeySchema = quoteServiceKeySchema;
export const estimatorCustomerTypeSchema = z.enum(["RESIDENTIAL", "COMMERCIAL"]);
export const estimatorAnswerSchema = z.union([
  z.string().trim().max(200),
  z.number().finite().min(0).max(100_000),
  z.boolean(),
]);
export const estimatorCalculationSchema = z
  .object({
    idempotencyKey: z.uuid(),
    honeypot: z.string().max(0).default(""),
    serviceKey: estimatorServiceKeySchema,
    customerType: estimatorCustomerTypeSchema,
    serviceAreaKey: quoteServiceAreaKeySchema,
    answers: z.record(z.string().trim().min(1).max(64), estimatorAnswerSchema),
  })
  .strict();
export const estimatorResultListQuerySchema = paginationSchema.extend({
  serviceKey: estimatorServiceKeySchema.optional(),
  outcome: z.enum(["RANGE", "MANUAL_REVIEW"]).optional(),
  archived: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default(false),
});
export const pricingVersionCreateSchema = z.object({
  versionCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(3)
    .max(64)
    .regex(/^[A-Z0-9][A-Z0-9._-]+$/),
  name: z.string().trim().min(3).max(160),
  notes: z.string().trim().max(2000).optional(),
  effectiveFrom: z.iso.datetime({ offset: true }).optional(),
  cloneFromVersionId: identifierSchema.optional(),
});
export const pricingVersionUpdateSchema = z.object({
  version: z.number().int().positive(),
  name: z.string().trim().min(3).max(160).optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  effectiveFrom: z.iso.datetime({ offset: true }).nullable().optional(),
  effectiveTo: z.iso.datetime({ offset: true }).nullable().optional(),
});
export const servicePricingConfigurationSchema = z.object({
  serviceKey: estimatorServiceKeySchema,
  enabled: z.boolean(),
  baseMinimumCents: z.number().int().nonnegative(),
  baseMaximumCents: z.number().int().nonnegative(),
  minimumChargeCents: z.number().int().nonnegative(),
  maximumEstimatorCents: z.number().int().positive(),
  roundingIncrementCents: z.number().int().positive(),
  displayOrder: z.number().int().min(0).max(100),
  customerDisclaimer: z.string().trim().min(10).max(1000),
  assumptions: z.array(z.string().trim().min(1).max(300)).max(20),
  exclusions: z.array(z.string().trim().min(1).max(300)).max(20),
});
export const pricingRuleSchema = z.object({
  ruleKey: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/),
  questionKey: z.string().trim().min(2).max(100),
  ruleType: z.enum([
    "FIXED_RANGE_ADDITION",
    "FIXED_RANGE_REPLACEMENT",
    "PER_UNIT_RANGE",
    "PERCENTAGE_RANGE_ADJUSTMENT",
    "TIER_RANGE",
    "MINIMUM_CHARGE",
    "SERVICE_AREA_RANGE_ADDITION",
    "CUSTOMER_TYPE_RANGE_ADDITION",
    "MANUAL_REVIEW",
  ]),
  conditionOperator: z.enum([
    "EQUALS",
    "NOT_EQUALS",
    "IN",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
    "BOOLEAN_TRUE",
    "BOOLEAN_FALSE",
  ]),
  comparisonValue: z
    .union([estimatorAnswerSchema, z.array(estimatorAnswerSchema).max(30)])
    .optional(),
  minimumAdjustmentCents: z.number().int().optional(),
  maximumAdjustmentCents: z.number().int().optional(),
  adjustmentBasisPoints: z.number().int().min(-10_000).max(100_000).optional(),
  sortOrder: z.number().int().min(0).max(10_000),
  enabled: z.boolean(),
  publicLabel: z.string().trim().min(1).max(200),
  internalDescription: z.string().trim().max(1000).optional(),
});
export const pricingPreviewSchema = estimatorCalculationSchema.omit({
  idempotencyKey: true,
  honeypot: true,
});

export type EstimatorCalculationInput = z.infer<typeof estimatorCalculationSchema>;
export type EstimatorResultListQuery = z.infer<typeof estimatorResultListQuerySchema>;
export type PricingVersionCreateInput = z.infer<typeof pricingVersionCreateSchema>;
export type PricingVersionUpdateInput = z.infer<typeof pricingVersionUpdateSchema>;
export type ServicePricingConfigurationInput = z.infer<typeof servicePricingConfigurationSchema>;
export type PricingRuleInput = z.infer<typeof pricingRuleSchema>;
export type PricingPreviewInput = z.infer<typeof pricingPreviewSchema>;
export const quoteListQuerySchema = paginationSchema.extend({
  search: safeText(120).optional(),
  status: quoteStatusSchema.optional(),
  assignedToUserId: identifierSchema.optional(),
  archived: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default(false),
});
export const quoteStatusUpdateSchema = z.object({ status: quoteStatusSchema });
export const quoteAssignmentSchema = z.object({ assignedToUserId: identifierSchema.nullable() });
export const quoteInternalNoteSchema = z.object({ body: safeText(3000).min(2) });
export const quoteArchiveSchema = z.object({ archive: z.boolean() });
export const quoteUploadOrderSchema = z.object({ uploadIds: z.array(identifierSchema).max(8) });
export type QuoteSubmissionInput = z.infer<typeof quoteSubmissionSchema>;
export type QuoteListQuery = z.infer<typeof quoteListQuerySchema>;
export type QuoteStatusUpdateInput = z.infer<typeof quoteStatusUpdateSchema>;
export type QuoteAssignmentInput = z.infer<typeof quoteAssignmentSchema>;
export type QuoteInternalNoteInput = z.infer<typeof quoteInternalNoteSchema>;

const blogPlainTextSchema = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .refine((value) => !/<\/?(?:script|iframe|object|embed|form|html|style)\b/i.test(value), {
      message: "Raw HTML and executable content are not supported",
    });
const blogLinkSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (value.startsWith("/")) return !value.startsWith("//");
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Use an internal path or an HTTP/HTTPS link");
export const blogSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .refine(
    (slug) =>
      !["category", "tag", "author", "search", "feed", "feed-xml", "preview", "new"].includes(slug),
    "This blog slug is reserved",
  );
export const blogStatusSchema = z.enum([
  "DRAFT",
  "IN_REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
]);
const textBlockSchema = z
  .object({
    type: z.enum(["paragraph", "heading2", "heading3", "blockquote"]),
    text: blogPlainTextSchema(5000).min(1),
    emphasis: z.boolean().default(false),
  })
  .strict();
const listBlockSchema = z
  .object({
    type: z.enum(["bulletList", "numberedList"]),
    items: z.array(blogPlainTextSchema(500).min(1)).min(1).max(30),
  })
  .strict();
const linkBlockSchema = z
  .object({
    type: z.literal("link"),
    text: blogPlainTextSchema(300).min(1),
    href: blogLinkSchema,
    emphasis: z.boolean().default(false),
  })
  .strict();
const imageBlockSchema = z.object({ type: z.literal("image"), mediaId: identifierSchema }).strict();
const calloutBlockSchema = z
  .object({
    type: z.literal("callout"),
    title: blogPlainTextSchema(160).optional(),
    text: blogPlainTextSchema(2000).min(1),
  })
  .strict();
const dividerBlockSchema = z.object({ type: z.literal("divider") }).strict();
export const blogContentBlockSchema = z.discriminatedUnion("type", [
  textBlockSchema,
  listBlockSchema,
  linkBlockSchema,
  imageBlockSchema,
  calloutBlockSchema,
  dividerBlockSchema,
]);
export const blogContentSchema = z.array(blogContentBlockSchema).max(200);
const blogPostMediaSchema = z
  .array(z.object({ mediaId: identifierSchema, sortOrder: z.number().int().min(0).max(100) }))
  .max(30)
  .superRefine((items, context) => {
    if (new Set(items.map(({ mediaId }) => mediaId)).size !== items.length)
      context.addIssue({ code: "custom", message: "Blog media identifiers must be unique" });
    if (new Set(items.map(({ sortOrder }) => sortOrder)).size !== items.length)
      context.addIssue({ code: "custom", message: "Blog media positions must be unique" });
  });
export const createBlogPostSchema = z
  .object({
    title: blogPlainTextSchema(180).min(3),
    slug: blogSlugSchema,
    excerpt: blogPlainTextSchema(500).default(""),
    content: blogContentSchema.default([]),
    featuredMediaId: identifierSchema.optional().nullable(),
    media: blogPostMediaSchema.default([]),
    categoryIds: z.array(identifierSchema).max(8).default([]),
    tagIds: z.array(identifierSchema).max(20).default([]),
    seoTitle: blogPlainTextSchema(70).optional().nullable(),
    seoDescription: blogPlainTextSchema(170).optional().nullable(),
  })
  .strict();
export const updateBlogPostSchema = createBlogPostSchema
  .partial()
  .extend({ version: z.number().int().positive() })
  .refine((value) => Object.keys(value).length > 1, "At least one field must be updated");
export const scheduleBlogPostSchema = z.object({
  version: z.number().int().positive(),
  scheduledFor: z.iso.datetime({ offset: true }),
});
export const blogPostVersionActionSchema = z.object({ version: z.number().int().positive() });
export const blogPostListQuerySchema = paginationSchema.extend({
  search: blogPlainTextSchema(100).optional(),
  status: blogStatusSchema.optional(),
  authorUserId: identifierSchema.optional(),
  categoryId: identifierSchema.optional(),
  tagId: identifierSchema.optional(),
  publishedFrom: z.iso.date().optional(),
  publishedTo: z.iso.date().optional(),
  scheduledFrom: z.iso.date().optional(),
  scheduledTo: z.iso.date().optional(),
});
export const publicBlogPostListQuerySchema = paginationSchema.extend({
  pageSize: z.coerce.number().int().min(1).max(24).default(12),
  search: blogPlainTextSchema(100).optional(),
  category: blogSlugSchema.optional(),
  tag: blogSlugSchema.optional(),
  author: blogSlugSchema.optional(),
});
export const blogTaxonomySchema = z.object({
  name: blogPlainTextSchema(100).min(2),
  slug: blogSlugSchema,
  description: blogPlainTextSchema(500).optional().default(""),
});
export const blogTagSchema = blogTaxonomySchema.omit({ description: true });
export const authorProfileSchema = z.object({
  displayName: blogPlainTextSchema(100).min(2),
  slug: blogSlugSchema,
  bio: blogPlainTextSchema(1000).default(""),
  profileMediaId: identifierSchema.optional().nullable(),
});
export const blogMediaUpdateSchema = z
  .object({
    altText: blogPlainTextSchema(300).optional(),
    caption: blogPlainTextSchema(500).optional().nullable(),
  })
  .refine((value) => value.altText !== undefined || value.caption !== undefined, {
    message: "At least one field must be updated",
  });
export const blogMediaOrderSchema = z.object({
  version: z.number().int().positive(),
  media: blogPostMediaSchema,
});
export type BlogContentBlockInput = z.infer<typeof blogContentBlockSchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type ScheduleBlogPostInput = z.infer<typeof scheduleBlogPostSchema>;
export type BlogPostListQuery = z.infer<typeof blogPostListQuerySchema>;
export type PublicBlogPostListQuery = z.infer<typeof publicBlogPostListQuerySchema>;
export type BlogTaxonomyInput = z.infer<typeof blogTaxonomySchema>;
export type BlogTagInput = z.infer<typeof blogTagSchema>;
export type AuthorProfileInput = z.infer<typeof authorProfileSchema>;
export type BlogMediaUpdateInput = z.infer<typeof blogMediaUpdateSchema>;

export const serviceJobStatusSchema = z.enum([
  "DRAFT",
  "READY_TO_SCHEDULE",
  "SCHEDULED",
  "CONFIRMED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETED",
  "FOLLOW_UP_REQUIRED",
  "CANCELLED",
  "CLOSED",
  "ARCHIVED",
]);
export const serviceJobAssignmentRoleSchema = z.enum(["LEAD", "CREW_MEMBER", "COORDINATOR"]);
export const serviceJobChecklistCategorySchema = z.enum([
  "PREPARATION",
  "ARRIVAL",
  "SERVICE",
  "SAFETY",
  "CLEANUP",
  "COMPLETION",
]);
export const serviceJobMediaCategorySchema = z.enum([
  "BEFORE",
  "DURING",
  "AFTER",
  "ACCESS",
  "ISSUE",
  "COMPLETION",
  "OTHER",
]);
export const serviceJobIncidentSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const vancouverLocalDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Use an unambiguous Vancouver local date and time");
const jobServiceSchema = z
  .object({
    serviceKey: quoteServiceKeySchema,
    scopeSummary: safeText(2000).optional().default(""),
  })
  .strict();
const jobCustomerSchema = z
  .object({
    customerType: z.enum(["RESIDENTIAL", "COMMERCIAL"]),
    customerName: safeText(120).min(2),
    customerEmail: z.email().max(254),
    customerPhone: safeText(32).min(7),
    companyName: safeText(160).optional().nullable(),
    propertyAddressLine1: safeText(160).min(3),
    propertyAddressLine2: safeText(160).optional().nullable(),
    city: safeText(80).min(2),
    serviceAreaKey: quoteServiceAreaKeySchema,
    province: z.literal("British Columbia"),
    postalCode: safeText(16).min(3),
    propertyType: safeText(80).min(2),
  })
  .strict();
export const createInternalServiceJobSchema = jobCustomerSchema
  .extend({
    services: z.array(jobServiceSchema).min(1).max(10),
    serviceScopeSummary: safeText(4000).min(3),
    accessNotes: safeText(3000).optional().nullable(),
    customerSchedulingNotes: safeText(3000).optional().nullable(),
    internalOperationalNotes: safeText(5000).optional().nullable(),
  })
  .strict();
export const convertQuoteToServiceJobSchema = z
  .object({
    confirmExternalAcceptance: z.boolean().default(false),
    serviceScopeSummary: safeText(4000).min(3),
  })
  .strict();
export const updateServiceJobSchema = z
  .object({
    version: z.number().int().positive(),
    serviceScopeSummary: safeText(4000).optional(),
    accessNotes: safeText(3000).optional().nullable(),
    customerSchedulingNotes: safeText(3000).optional().nullable(),
    internalOperationalNotes: safeText(5000).optional().nullable(),
    followUpRequired: z.boolean().optional(),
    followUpNotes: safeText(3000).optional().nullable(),
  })
  .strict();
export const serviceJobScheduleSchema = z
  .object({
    version: z.number().int().positive(),
    startLocal: vancouverLocalDateTimeSchema,
    estimatedDurationMinutes: z.number().int().min(30).max(960),
    reason: safeText(1000).min(3),
    disambiguation: z.enum(["earlier", "later"]).optional(),
    overrideConflict: z.boolean().default(false),
    conflictOverrideReason: safeText(1000).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.overrideConflict && !value.conflictOverrideReason)
      context.addIssue({
        code: "custom",
        path: ["conflictOverrideReason"],
        message: "A written conflict-override reason is required",
      });
  });
export const serviceJobAssignmentSchema = z
  .object({
    userId: identifierSchema,
    assignmentRole: serviceJobAssignmentRoleSchema,
    notes: safeText(1000).optional(),
  })
  .strict();
export const serviceJobStatusTransitionSchema = z
  .object({
    version: z.number().int().positive(),
    status: serviceJobStatusSchema,
    reason: safeText(1000).optional(),
    overrideReason: safeText(1000).optional(),
  })
  .strict();
export const serviceJobCompletionSchema = z
  .object({
    version: z.number().int().positive(),
    completionSummary: safeText(4000).min(10),
    followUpRequired: z.boolean().default(false),
    followUpNotes: safeText(3000).optional(),
    overrideReason: safeText(1000).optional(),
  })
  .strict();
export const serviceJobCancellationSchema = z
  .object({
    version: z.number().int().positive(),
    reason: safeText(1000).min(5),
    customerNote: safeText(3000).optional(),
    notifyCustomer: z.boolean().default(false),
  })
  .strict();
export const serviceJobChecklistItemSchema = z
  .object({
    label: safeText(200).min(2),
    description: safeText(1000).optional(),
    category: serviceJobChecklistCategorySchema,
    required: z.boolean().default(false),
    notes: safeText(1000).optional(),
  })
  .strict();
export const serviceJobChecklistUpdateSchema = z
  .object({
    version: z.number().int().positive(),
    completed: z.boolean().optional(),
    label: safeText(200).min(2).optional(),
    description: safeText(1000).optional().nullable(),
    required: z.boolean().optional(),
    notes: safeText(1000).optional().nullable(),
    direction: z.enum(["up", "down"]).optional(),
  })
  .strict();
export const serviceJobNoteSchema = z
  .object({ visibility: z.enum(["INTERNAL", "CUSTOMER_FACING"]), body: safeText(3000).min(2) })
  .strict();
export const serviceJobNoteUpdateSchema = z.object({ body: safeText(3000).min(2) }).strict();
export const serviceJobIncidentSchema = z
  .object({
    title: safeText(200).min(2),
    description: safeText(3000).min(2),
    severity: serviceJobIncidentSeveritySchema,
    blocksCompletion: z.boolean().default(false),
  })
  .strict();
export const serviceJobIncidentUpdateSchema = z
  .object({ resolutionNotes: safeText(2000).min(3), resolved: z.boolean() })
  .strict();
export const serviceJobMediaMetadataSchema = z
  .object({
    category: serviceJobMediaCategorySchema,
    altText: safeText(300).default(""),
    caption: safeText(500).optional().nullable(),
  })
  .strict();
export const serviceJobMediaUpdateSchema = z
  .object({
    category: serviceJobMediaCategorySchema.optional(),
    altText: safeText(300).optional(),
    caption: safeText(500).optional().nullable(),
    direction: z.enum(["up", "down"]).optional(),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((entry) => entry !== undefined),
    "At least one media field must be updated",
  );
export const serviceJobListQuerySchema = paginationSchema.extend({
  search: safeText(100).optional(),
  status: serviceJobStatusSchema.optional(),
  serviceKey: quoteServiceKeySchema.optional(),
  serviceAreaKey: quoteServiceAreaKeySchema.optional(),
  assignedUserId: identifierSchema.optional(),
  scheduledFrom: z.iso.datetime({ offset: true }).optional(),
  scheduledTo: z.iso.datetime({ offset: true }).optional(),
  followUpRequired: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  archived: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default(false),
});
export const serviceJobCalendarQuerySchema = z
  .object({
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
    status: serviceJobStatusSchema.optional(),
    assignedUserId: identifierSchema.optional(),
    serviceKey: quoteServiceKeySchema.optional(),
    serviceAreaKey: quoteServiceAreaKeySchema.optional(),
  })
  .strict();
export const serviceJobNotificationSchema = z
  .object({
    type: z.enum(["SCHEDULED", "RESCHEDULED", "CANCELLED", "COMPLETED"]),
    idempotencyKey: z.uuid(),
  })
  .strict();

export type CreateInternalServiceJobInput = z.infer<typeof createInternalServiceJobSchema>;
export type ConvertQuoteToServiceJobInput = z.infer<typeof convertQuoteToServiceJobSchema>;
export type UpdateServiceJobInput = z.infer<typeof updateServiceJobSchema>;
export type ServiceJobScheduleInput = z.infer<typeof serviceJobScheduleSchema>;
export type ServiceJobAssignmentInput = z.infer<typeof serviceJobAssignmentSchema>;
export type ServiceJobStatusTransitionInput = z.infer<typeof serviceJobStatusTransitionSchema>;
export type ServiceJobCompletionInput = z.infer<typeof serviceJobCompletionSchema>;
export type ServiceJobCancellationInput = z.infer<typeof serviceJobCancellationSchema>;
export type ServiceJobChecklistItemInput = z.infer<typeof serviceJobChecklistItemSchema>;
export type ServiceJobChecklistUpdateInput = z.infer<typeof serviceJobChecklistUpdateSchema>;
export type ServiceJobNoteInput = z.infer<typeof serviceJobNoteSchema>;
export type ServiceJobNoteUpdateInput = z.infer<typeof serviceJobNoteUpdateSchema>;
export type ServiceJobIncidentInput = z.infer<typeof serviceJobIncidentSchema>;
export type ServiceJobIncidentUpdateInput = z.infer<typeof serviceJobIncidentUpdateSchema>;
export type ServiceJobMediaMetadataInput = z.infer<typeof serviceJobMediaMetadataSchema>;
export type ServiceJobMediaUpdateInput = z.infer<typeof serviceJobMediaUpdateSchema>;
export type ServiceJobListQuery = z.infer<typeof serviceJobListQuerySchema>;
export type ServiceJobCalendarQuery = z.infer<typeof serviceJobCalendarQuerySchema>;
export type ServiceJobNotificationInput = z.infer<typeof serviceJobNotificationSchema>;
