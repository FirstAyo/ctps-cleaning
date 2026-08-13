import { describe, expect, it } from "vitest";

import {
  ALL_PERMISSION_KEYS,
  PERMISSION_KEYS,
  ROLE_KEYS,
  combinePermissionKeys,
  hasEveryPermission,
  isPermissionKey,
} from "../src";

describe("permission contract", () => {
  it("contains unique foundational and implemented feature permissions", () => {
    expect(new Set(ALL_PERMISSION_KEYS).size).toBe(ALL_PERMISSION_KEYS.length);
    expect(ALL_PERMISSION_KEYS.every(isPermissionKey)).toBe(true);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_PUBLISH);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.MEDIA_BEFORE_AFTER_UPLOAD);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.QUOTE_REQUESTS_READ_PRIVATE_MEDIA);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.PRICING_VERSIONS_PUBLISH);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.BLOG_POSTS_READ_OWN);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.BLOG_POSTS_READ_ALL);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.BLOG_POSTS_SCHEDULE_OWN);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.BLOG_MEDIA_UPLOAD_OWN);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.AUTHOR_PROFILES_UPDATE_OWN);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.JOBS_CREATE_FROM_QUOTE);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.JOBS_READ_ASSIGNED);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.JOBS_OVERRIDE_CONFLICTS);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.JOBS_OVERRIDE_COMPLETION);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.PAGES_PUBLISH);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.MEDIA_LIBRARY_UPLOAD);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.MEDIA_LIBRARY_ARCHIVE);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.MEDIA_LIBRARY_RESTORE);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.NAVIGATION_UPDATE);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.SITE_SETTINGS_UPDATE);
    expect(ALL_PERMISSION_KEYS).toContain(PERMISSION_KEYS.SEO_VIEW);
  });

  it("combines multiple roles without accepting unknown keys", () => {
    const combined = combinePermissionKeys([
      [PERMISSION_KEYS.ADMIN_ACCESS],
      [PERMISSION_KEYS.USERS_READ, "unknown.permission"],
    ]);
    expect(combined).toEqual([PERMISSION_KEYS.ADMIN_ACCESS, PERMISSION_KEYS.USERS_READ]);
    expect(
      hasEveryPermission(combined, [PERMISSION_KEYS.ADMIN_ACCESS, PERMISSION_KEYS.USERS_READ]),
    ).toBe(true);
  });

  it("defines the protected system role keys", () => {
    expect(Object.values(ROLE_KEYS)).toEqual(["SUPER_ADMIN", "ADMIN", "AUTHOR"]);
  });
});
