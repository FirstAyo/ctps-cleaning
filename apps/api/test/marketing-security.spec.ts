import { describe, expect, it } from "vitest";
import { PERMISSION_KEYS } from "@ctps/permissions";
import {
  apiEnvironmentSchema,
  marketingPageKeySchema,
  publicMediaUpdateSchema,
} from "@ctps/validation";
import { IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY } from "../src/auth/security.decorators";
import { MarketingMediaController } from "../src/marketing/marketing-media.controller";

describe("Phase 11 marketing security boundary", () => {
  it("accepts fixed page keys and rejects client-invented pages", () => {
    expect(marketingPageKeySchema.safeParse("HOME").success).toBe(true);
    expect(marketingPageKeySchema.safeParse("CUSTOM_SALES_PAGE").success).toBe(false);
  });
  it("bounds focal points and does not accept external media URLs", () => {
    expect(
      publicMediaUpdateSchema.safeParse({
        title: "Property exterior",
        focalPointX: 50,
        focalPointY: 35,
      }).success,
    ).toBe(true);
    expect(
      publicMediaUpdateSchema.safeParse({
        title: "Property exterior",
        focalPointX: 101,
        url: "https://example.com/image.jpg",
      }).success,
    ).toBe(false);
  });
  it("uses a dedicated public marketing-media root", () => {
    const value = apiEnvironmentSchema.parse({
      ADMIN_URL: "http://localhost:3001",
      WEB_URL: "http://localhost:3000",
      DATABASE_URL: "postgresql://ctps:development@localhost:55432/ctps",
      CORS_ALLOWED_ORIGINS: "http://localhost:3000,http://localhost:3001",
    });
    expect(value.MARKETING_MEDIA_PUBLIC_ROOT).toContain("storage/public/marketing");
    expect(value.MARKETING_MEDIA_PUBLIC_ROOT).not.toContain("private");
  });
  it("keeps Admin media endpoints protected while only variant delivery is public", () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, MarketingMediaController.prototype.list)).toBe(
      undefined,
    );
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, MarketingMediaController.prototype.list),
    ).toEqual([PERMISSION_KEYS.MEDIA_LIBRARY_READ]);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, MarketingMediaController.prototype.upload)).toBe(
      undefined,
    );
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, MarketingMediaController.prototype.upload),
    ).toEqual([PERMISSION_KEYS.MEDIA_LIBRARY_UPLOAD]);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, MarketingMediaController.prototype.file)).toBe(true);
  });
});
