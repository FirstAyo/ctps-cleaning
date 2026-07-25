import { describe, expect, it } from "vitest";

import {
  beforeAfterSlugSchema,
  createBeforeAfterProjectSchema,
  publicBeforeAfterProjectListQuerySchema,
} from "../src";

const id = (suffix: string) => `00000000-0000-4000-8000-0000000000${suffix}`;

describe("before-and-after validation", () => {
  it("normalizes safe slugs and rejects reserved or unsafe values", () => {
    expect(beforeAfterSlugSchema.parse(" Window-Restoration ")).toBe("window-restoration");
    expect(beforeAfterSlugSchema.safeParse("../private").success).toBe(false);
    expect(beforeAfterSlugSchema.safeParse("admin").success).toBe(false);
  });

  it("rejects duplicate supporting media and ordering positions", () => {
    const base = {
      title: "Window restoration",
      slug: "window-restoration",
      serviceKey: "window-cleaning",
      serviceAreaKey: "vancouver",
    } as const;
    expect(
      createBeforeAfterProjectSchema.safeParse({
        ...base,
        supportingMedia: [
          { mediaId: id("01"), category: "BEFORE", sortOrder: 0 },
          { mediaId: id("01"), category: "AFTER", sortOrder: 1 },
        ],
      }).success,
    ).toBe(false);
    expect(
      createBeforeAfterProjectSchema.safeParse({
        ...base,
        supportingMedia: [
          { mediaId: id("01"), category: "BEFORE", sortOrder: 0 },
          { mediaId: id("02"), category: "AFTER", sortOrder: 0 },
        ],
      }).success,
    ).toBe(false);
  });

  it("bounds public pagination and parses only approved filters", () => {
    expect(
      publicBeforeAfterProjectListQuerySchema.parse({
        page: "2",
        pageSize: "24",
        featured: "true",
        serviceKey: "window-cleaning",
      }),
    ).toMatchObject({ page: 2, pageSize: 24, featured: true });
    expect(publicBeforeAfterProjectListQuerySchema.safeParse({ pageSize: "25" }).success).toBe(
      false,
    );
  });
});
