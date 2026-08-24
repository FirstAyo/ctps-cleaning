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

  it("defaults creation to Draft and accepts only explicit publication intent", () => {
    const base = {
      title: "Window restoration",
      slug: "window-restoration",
      serviceKey: "window-cleaning",
      serviceAreaKey: "vancouver",
    } as const;
    expect(createBeforeAfterProjectSchema.parse(base).intent).toBe("SAVE_DRAFT");
    expect(createBeforeAfterProjectSchema.parse({ ...base, intent: "PUBLISH" }).intent).toBe(
      "PUBLISH",
    );
    expect(createBeforeAfterProjectSchema.safeParse({ ...base, intent: "DELETE" }).success).toBe(
      false,
    );
  });

  it("accepts controlled project rich text and rejects unsafe links and raw HTML", () => {
    const base = {
      title: "Window restoration",
      slug: "window-restoration",
      serviceKey: "window-cleaning",
      serviceAreaKey: "vancouver",
    } as const;
    const content = (href: string, text = "A safe summary") => [
      {
        type: "richText",
        style: "paragraph",
        content: [{ type: "text", text, marks: [{ type: "link", href }] }],
      },
    ];
    expect(
      createBeforeAfterProjectSchema.safeParse({
        ...base,
        summaryContent: content("/services/window-cleaning"),
      }).success,
    ).toBe(true);
    for (const unsafe of ["javascript:alert(1)", "data:text/html,bad", "vbscript:bad"])
      expect(
        createBeforeAfterProjectSchema.safeParse({ ...base, summaryContent: content(unsafe) })
          .success,
      ).toBe(false);
    expect(
      createBeforeAfterProjectSchema.safeParse({
        ...base,
        descriptionContent: content("/", "<script>alert(1)</script>"),
      }).success,
    ).toBe(false);
  });
});
