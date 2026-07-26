import { ALL_PERMISSION_KEYS, PERMISSION_KEYS, ROLE_KEYS } from "@ctps/permissions";
import { describe, expect, it, vi } from "vitest";

import { initializeSystemAccess } from "../src/auth/system-access";

describe("Phase 8 permission initialization", () => {
  it("is additive/idempotent and grants Author only approved own-content defaults", async () => {
    const grants: { roleId: string; permissionId: string }[] = [];
    const transaction = {
      permission: {
        upsert: vi.fn(({ where }: { where: { key: string } }) =>
          Promise.resolve({ id: `p:${where.key}` }),
        ),
      },
      role: {
        upsert: vi.fn(({ where }: { where: { key: string } }) =>
          Promise.resolve({ id: `r:${where.key}` }),
        ),
      },
      rolePermission: {
        upsert: vi.fn(({ create }: { create: { roleId: string; permissionId: string } }) => {
          grants.push(create);
          return Promise.resolve(create);
        }),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (client: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const first = await initializeSystemAccess(prisma as never);
    const second = await initializeSystemAccess(prisma as never);
    expect(first).toEqual({ roles: 3, permissions: ALL_PERMISSION_KEYS.length });
    expect(second).toEqual(first);
    const author = new Set(
      grants
        .filter(({ roleId }) => roleId === `r:${ROLE_KEYS.AUTHOR}`)
        .map(({ permissionId }) => permissionId.slice(2)),
    );
    expect(author).toContain(PERMISSION_KEYS.BLOG_POSTS_CREATE);
    expect(author).toContain(PERMISSION_KEYS.BLOG_POSTS_PUBLISH_OWN);
    expect(author).toContain(PERMISSION_KEYS.BLOG_POSTS_SCHEDULE_OWN);
    expect(author).toContain(PERMISSION_KEYS.BLOG_MEDIA_UPLOAD_OWN);
    expect(author).not.toContain(PERMISSION_KEYS.BLOG_POSTS_READ_ALL);
    expect(author).not.toContain(PERMISSION_KEYS.BLOG_POSTS_PUBLISH_ALL);
    expect(author).not.toContain(PERMISSION_KEYS.QUOTE_REQUESTS_READ);
    expect(author).not.toContain(PERMISSION_KEYS.PRICING_VERSIONS_READ);
    expect(author).not.toContain(PERMISSION_KEYS.JOBS_READ);
    expect(author).not.toContain(PERMISSION_KEYS.JOBS_READ_ASSIGNED);
    expect(author).not.toContain(PERMISSION_KEYS.JOBS_UPLOAD_PRIVATE_MEDIA);
  });
});
