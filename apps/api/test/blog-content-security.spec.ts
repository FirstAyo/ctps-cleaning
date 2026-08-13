import { NotFoundException } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ctps/permissions";
import { blogContentSchema, createBlogPostSchema } from "@ctps/validation";
import { describe, expect, it, vi } from "vitest";

import { blogContentText, blogReadingTime, referencedBlogMedia } from "../src/blog/blog-content";
import { BlogService } from "../src/blog/blog.service";

const ownerId = "00000000-0000-4000-8000-000000000001";
const mediaId = "00000000-0000-4000-8000-000000000002";
const now = new Date("2026-07-25T12:00:00.000Z");
function post(overrides: Record<string, unknown> = {}) {
  const media = {
    id: mediaId,
    originalFilename: "clean.webp",
    altText: "Clean windows",
    caption: null,
    width: 1200,
    height: 800,
    visibility: "PRIVATE",
    uploadedByUserId: ownerId,
    variants: [{ kind: "FEATURED", width: 1200, height: 675 }],
  };
  return {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "safe-cleaning-guide",
    title: "Safe cleaning guide",
    excerpt: "A practical guide.",
    content: [{ type: "paragraph", text: "Useful guidance", emphasis: false }],
    contentFormat: "STRUCTURED_BLOCKS",
    searchText: "Useful guidance",
    status: "DRAFT",
    authorUserId: ownerId,
    author: {
      displayName: "Author",
      authorProfile: {
        displayName: "Author",
        slug: "author",
        bio: "CTPS author",
        profileMedia: null,
      },
    },
    featuredMediaId: mediaId,
    featuredMedia: media,
    media: [{ mediaId, sortOrder: 0, media }],
    categories: [
      {
        categoryId: "category",
        category: {
          id: "category",
          slug: "care",
          name: "Care",
          description: "Care",
          normalizedName: "care",
          createdAt: now,
          updatedAt: now,
        },
      },
    ],
    tags: [],
    seoTitle: null,
    seoDescription: null,
    publishedAt: null,
    scheduledFor: null,
    archivedAt: null,
    readingTimeMinutes: 1,
    version: 1,
    createdAt: now,
    updatedAt: now,
    _count: { revisions: 1 },
    ...overrides,
  };
}
function identity(userId: string, permissions: string[]) {
  return {
    userId,
    email: "author@example.com",
    displayName: "Author",
    mustChangePassword: false,
    roleKeys: ["AUTHOR"],
    permissions,
    sessionId: "session",
    sessionCreatedAt: now,
    sessionAbsoluteExpiresAt: now,
    sessionIdleExpiresAt: now,
    csrfTokenHash: null,
  } as never;
}
function service(current = post(), due: unknown[] = []) {
  const database = {
    client: {
      blogPost: {
        findUnique: vi.fn().mockResolvedValue(current),
        findMany: vi.fn().mockResolvedValue(due),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    },
  };
  const media = { publish: vi.fn() };
  const audit = { record: vi.fn() };
  return {
    blog: new BlogService(
      database as never,
      media as never,
      audit as never,
      { value: { BLOG_SCHEDULE_BATCH_SIZE: 20 } } as never,
    ),
    database,
    media,
    audit,
  };
}

describe("safe structured blog content", () => {
  it("accepts supported blocks and computes searchable text, media references, and deterministic reading time", () => {
    const content = [
      { type: "heading2", text: "Seasonal care", emphasis: false },
      { type: "image", mediaId },
      { type: "bulletList", items: ["Windows", "Gutters"] },
    ] as const;
    expect(blogContentSchema.safeParse(content).success).toBe(true);
    expect(blogContentText(content as never)).toContain("Seasonal care");
    expect(referencedBlogMedia(content as never)).toEqual([mediaId]);
    expect(blogReadingTime(content as never)).toBe(1);
  });
  it.each([
    [{ type: "paragraph", text: "<script>alert(1)</script>", emphasis: false }],
    [{ type: "link", text: "Unsafe", href: "javascript:alert(1)", emphasis: false }],
    [{ type: "image", mediaId, imageUrl: "https://remote.example/image.jpg" }],
  ])("rejects executable, unsafe-link, and external-image fields", (block) => {
    expect(blogContentSchema.safeParse([block]).success).toBe(false);
  });
  it("rejects external image fields at the post boundary", () => {
    expect(
      createBlogPostSchema.safeParse({
        title: "Safe title",
        slug: "safe-title",
        excerpt: "Excerpt",
        content: [],
        media: [],
        categoryIds: [],
        tagIds: [],
        imageUrl: "https://remote.example/a.jpg",
      }).success,
    ).toBe(false);
  });
  it("accepts the Phase 11.3 allowlisted rich-text structure", () => {
    const content = [
      {
        type: "richText",
        style: "heading4",
        content: [
          {
            type: "text",
            text: "Safe linked guidance",
            marks: [
              { type: "bold" },
              { type: "italic" },
              { type: "underline" },
              { type: "link", href: "/services" },
            ],
          },
        ],
      },
      {
        type: "richList",
        style: "numbered",
        items: [[{ type: "text", text: "First", marks: [] }]],
      },
      { type: "managedImage", mediaId, layout: "wide" },
    ];
    const result = blogContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    expect(blogContentText(result.data!)).toContain("Safe linked guidance First");
    expect(referencedBlogMedia(result.data!)).toEqual([mediaId]);
  });
  it.each([
    ["pasted script", { type: "text", text: "<script>alert(1)</script>", marks: [] }],
    ["event-handler HTML", { type: "text", text: '<img onerror="alert(1)">', marks: [] }],
    [
      "javascript URL",
      { type: "text", text: "unsafe", marks: [{ type: "link", href: "javascript:alert(1)" }] },
    ],
    [
      "dangerous data URL",
      { type: "text", text: "unsafe", marks: [{ type: "link", href: "data:text/html,alert(1)" }] },
    ],
    ["iframe", { type: "text", text: "<iframe src='https://example.com'>", marks: [] }],
    ["unsupported mark", { type: "text", text: "unsafe", marks: [{ type: "script" }] }],
  ])("rejects unsafe rich content: %s", (_name, inline) => {
    expect(
      blogContentSchema.safeParse([{ type: "richText", style: "paragraph", content: [inline] }])
        .success,
    ).toBe(false);
  });
});

describe("blog ownership and scheduled publishing", () => {
  it("conceals another author's draft while allowing an all-post permission", async () => {
    const { blog } = service();
    await expect(
      blog.get(post().id, identity("different", [PERMISSION_KEYS.BLOG_POSTS_READ_OWN])),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      blog.get(post().id, identity("admin", [PERMISSION_KEYS.BLOG_POSTS_READ_ALL])),
    ).resolves.toMatchObject({ slug: "safe-cleaning-guide" });
  });
  it("publishes a due scheduled post once and leaves no work for a repeated run", async () => {
    const scheduled = post({
      status: "SCHEDULED",
      scheduledFor: new Date("2026-07-25T11:00:00.000Z"),
    });
    const { blog, database, media, audit } = service(scheduled, [scheduled]);
    expect(await blog.publishDue()).toEqual({ examined: 1, published: 1, invalid: 0 });
    expect(media.publish).toHaveBeenCalledWith([mediaId]);
    expect(database.client.blogPost.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "SCHEDULED" }) }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "blog_post.published" }),
    );
    database.client.blogPost.findMany.mockResolvedValueOnce([]);
    expect(await blog.publishDue()).toEqual({ examined: 0, published: 0, invalid: 0 });
  });
  it("does not publish an invalid due post", async () => {
    const invalid = post({
      status: "SCHEDULED",
      featuredMedia: null,
      featuredMediaId: null,
      scheduledFor: new Date("2026-07-25T11:00:00.000Z"),
    });
    const { blog, database, media } = service(invalid, [invalid]);
    expect(await blog.publishDue()).toEqual({ examined: 1, published: 0, invalid: 1 });
    expect(database.client.blogPost.updateMany).not.toHaveBeenCalled();
    expect(media.publish).not.toHaveBeenCalled();
  });
});
