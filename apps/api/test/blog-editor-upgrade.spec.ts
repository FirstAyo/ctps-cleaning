import { PERMISSION_KEYS } from "@ctps/permissions";
import { describe, expect, it, vi } from "vitest";

import { BlogService } from "../src/blog/blog.service";

const postId = "00000000-0000-4000-8000-000000000001";
const revisionId = "00000000-0000-4000-8000-000000000002";
const ownerId = "00000000-0000-4000-8000-000000000003";
const categoryId = "00000000-0000-4000-8000-000000000004";
const now = new Date("2026-08-12T12:00:00.000Z");

const current = {
  id: postId,
  slug: "current-slug",
  title: "Current article",
  excerpt: "Current excerpt",
  content: [{ type: "paragraph", text: "Current content", emphasis: false }],
  contentFormat: "STRUCTURED_BLOCKS",
  status: "DRAFT",
  authorUserId: ownerId,
  author: { displayName: "Writer", authorProfile: null },
  featuredMediaId: null,
  featuredMedia: null,
  media: [],
  categories: [],
  tags: [],
  seoTitle: null,
  seoDescription: null,
  publishedAt: null,
  scheduledFor: null,
  archivedAt: null,
  readingTimeMinutes: 1,
  version: 4,
  createdAt: now,
  updatedAt: now,
  _count: { revisions: 4 },
};
const snapshot = {
  id: revisionId,
  postId,
  revisionNumber: 2,
  title: "Historical article",
  slug: "historical-slug",
  excerpt: "Historical excerpt",
  content: [
    {
      type: "richText",
      style: "paragraph",
      content: [{ type: "text", text: "Historical content", marks: [{ type: "bold" }] }],
    },
  ],
  contentFormat: "STRUCTURED_BLOCKS",
  statusSnapshot: "DRAFT",
  seoTitle: "Historical SEO title",
  seoDescription: "Historical description",
  featuredMediaId: null,
  categoryIdsSnapshot: [categoryId],
  tagIdsSnapshot: [],
  actorUserId: ownerId,
  createdAt: now,
};

function identity() {
  return {
    userId: ownerId,
    permissions: [
      PERMISSION_KEYS.BLOG_POSTS_UPDATE_OWN,
      PERMISSION_KEYS.BLOG_POSTS_READ_OWN,
      PERMISSION_KEYS.BLOG_REVISIONS_READ_OWN,
    ],
  } as never;
}

describe("Phase 11.3 Blog revision restoration", () => {
  it("restores a validated snapshot as a new Draft revision with optimistic concurrency", async () => {
    const restored = { ...current, ...snapshot, id: postId, version: 5, _count: { revisions: 5 } };
    const transaction = {
      blogPost: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue(restored),
      },
      blogPostCategory: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      blogPostTag: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      blogPostMedia: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      blogSlugRedirect: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        upsert: vi.fn().mockResolvedValue({}),
      },
      blogPostRevision: {
        aggregate: vi.fn().mockResolvedValue({ _max: { revisionNumber: 4 } }),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const database = {
      client: {
        blogPost: {
          findUnique: vi.fn().mockResolvedValueOnce(current).mockResolvedValueOnce(restored),
          findFirst: vi.fn().mockResolvedValue(null),
        },
        blogPostRevision: { findFirst: vi.fn().mockResolvedValue(snapshot) },
        blogCategory: { count: vi.fn().mockResolvedValue(1) },
        blogTag: { count: vi.fn().mockResolvedValue(0) },
        $transaction: vi.fn((callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
        ),
      },
    };
    const media = { validateOwned: vi.fn().mockResolvedValue([]), revokeUnused: vi.fn() };
    const audit = { record: vi.fn() };
    const blog = new BlogService(database as never, media as never, audit as never, {} as never);

    await expect(blog.restoreRevision(postId, revisionId, 4, identity())).resolves.toMatchObject({
      title: "Historical article",
      status: "DRAFT",
      version: 5,
    });
    expect(transaction.blogPost.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: postId, version: 4 },
        data: expect.objectContaining({ status: "DRAFT", slug: "historical-slug" }),
      }),
    );
    expect(transaction.blogPostRevision.create).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "blog_post.revision_restored" }),
    );
  });
});
