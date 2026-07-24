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
  it("contains unique foundational Phase 3 keys only", () => {
    expect(new Set(ALL_PERMISSION_KEYS).size).toBe(ALL_PERMISSION_KEYS.length);
    expect(ALL_PERMISSION_KEYS.every(isPermissionKey)).toBe(true);
    expect(ALL_PERMISSION_KEYS.some((key) => /quote|price|blog|media|project/.test(key))).toBe(
      false,
    );
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
