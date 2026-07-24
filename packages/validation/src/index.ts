import { z } from "zod";

const nodeEnvironmentSchema = z.enum(["development", "test", "production"]);
const portSchema = z.coerce.number().int().min(1).max(65_535);
const httpUrlSchema = z
  .url()
  .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
    message: "Expected an HTTP or HTTPS URL",
  });

export const apiEnvironmentSchema = z.object({
  API_PORT: portSchema.default(4000),
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
  NODE_ENV: nodeEnvironmentSchema.default("development"),
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
