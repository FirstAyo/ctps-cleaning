import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@ctps/database";
import { hasPermission, PERMISSION_KEYS, type PermissionKey } from "@ctps/permissions";
import type {
  AuthorProfileInput,
  BlogPostListQuery,
  BlogTagInput,
  BlogTaxonomyInput,
  CreateBlogPostInput,
  PublicBlogPostListQuery,
  ScheduleBlogPostInput,
  UpdateBlogPostInput,
} from "@ctps/validation";
import { blogContentSchema } from "@ctps/validation";

import { AuditService } from "../auth/audit.service";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { DatabaseService } from "../database/database.service";
import { blogContentText, blogReadingTime, referencedBlogMedia } from "./blog-content";
import { BlogMediaService } from "./blog-media.service";
import { BlogConfigService } from "./blog-config.service";

const mediaSelect = {
  id: true,
  originalFilename: true,
  altText: true,
  caption: true,
  width: true,
  height: true,
  visibility: true,
  uploadedByUserId: true,
  variants: { select: { kind: true, width: true, height: true } },
} as const;
const postInclude = {
  author: {
    select: {
      displayName: true,
      authorProfile: { include: { profileMedia: { select: mediaSelect } } },
    },
  },
  featuredMedia: { select: mediaSelect },
  categories: { include: { category: true }, orderBy: { category: { name: "asc" as const } } },
  tags: { include: { tag: true }, orderBy: { tag: { name: "asc" as const } } },
  media: {
    include: { media: { select: mediaSelect } },
    orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
  },
  _count: { select: { revisions: true } },
} satisfies Prisma.BlogPostInclude;

type IncludedPost = Prisma.BlogPostGetPayload<{ include: typeof postInclude }>;

@Injectable()
export class BlogService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(BlogMediaService) private readonly media: BlogMediaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(BlogConfigService) private readonly config: BlogConfigService,
  ) {}

  private allowed(
    identity: AuthenticatedIdentity,
    ownerId: string,
    own: PermissionKey,
    all: PermissionKey,
  ) {
    return (
      hasPermission(identity.permissions, all) ||
      (identity.userId === ownerId && hasPermission(identity.permissions, own))
    );
  }
  private authorize(
    identity: AuthenticatedIdentity,
    ownerId: string,
    own: PermissionKey,
    all: PermissionKey,
  ) {
    if (!this.allowed(identity, ownerId, own, all))
      throw new NotFoundException({
        code: "BLOG_POST_NOT_FOUND",
        message: "The blog post was not found.",
      });
  }
  private mediaResponse(media: IncludedPost["featuredMedia"]) {
    if (!media) return null;
    return {
      id: media.id,
      originalFilename: media.originalFilename,
      altText: media.altText,
      caption: media.caption,
      width: media.width,
      height: media.height,
      visibility: media.visibility,
      variants: Object.fromEntries(
        media.variants.map((variant) => [
          variant.kind.toLowerCase().replaceAll("_", "-"),
          {
            path: `/media/blog/${media.id}/${variant.kind.toLowerCase().replaceAll("_", "-")}`,
            width: variant.width,
            height: variant.height,
          },
        ]),
      ),
    };
  }
  private adminResponse(post: IncludedPost) {
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      status: post.status,
      authorUserId: post.authorUserId,
      author: { displayName: post.author.authorProfile?.displayName ?? post.author.displayName },
      featuredMediaId: post.featuredMediaId,
      featuredMedia: this.mediaResponse(post.featuredMedia),
      media: post.media.map((link) => ({
        mediaId: link.mediaId,
        sortOrder: link.sortOrder,
        media: this.mediaResponse(link.media),
      })),
      categories: post.categories.map(({ category }) => category),
      tags: post.tags.map(({ tag }) => tag),
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      publishedAt: post.publishedAt,
      scheduledFor: post.scheduledFor,
      archivedAt: post.archivedAt,
      readingTimeMinutes: post.readingTimeMinutes,
      version: post.version,
      revisionCount: post._count.revisions,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
  private publicResponse(post: IncludedPost) {
    const profile = post.author.authorProfile;
    return {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      featuredMedia: this.mediaResponse(post.featuredMedia),
      media: post.media.map((link) => ({
        sortOrder: link.sortOrder,
        media: this.mediaResponse(link.media),
      })),
      categories: post.categories.map(({ category }) => ({
        slug: category.slug,
        name: category.name,
        description: category.description,
      })),
      tags: post.tags.map(({ tag }) => ({ slug: tag.slug, name: tag.name })),
      author: {
        slug: profile?.slug ?? null,
        displayName: profile?.displayName ?? post.author.displayName,
        bio: profile?.bio ?? "",
        profileMedia: this.mediaResponse(profile?.profileMedia ?? null),
      },
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      readingTimeMinutes: post.readingTimeMinutes,
    };
  }
  private async find(id: string) {
    const post = await this.database.client.blogPost.findUnique({
      where: { id },
      include: postInclude,
    });
    if (!post)
      throw new NotFoundException({
        code: "BLOG_POST_NOT_FOUND",
        message: "The blog post was not found.",
      });
    return post;
  }
  private allMediaIds(post: IncludedPost) {
    return [
      ...new Set(
        [
          post.featuredMediaId,
          post.author.authorProfile?.profileMedia?.id,
          ...post.media.map(({ mediaId }) => mediaId),
        ].filter((id): id is string => Boolean(id)),
      ),
    ];
  }
  private async assertTaxonomy(categoryIds: readonly string[], tagIds: readonly string[]) {
    const [categories, tags] = await Promise.all([
      this.database.client.blogCategory.count({ where: { id: { in: [...new Set(categoryIds)] } } }),
      this.database.client.blogTag.count({ where: { id: { in: [...new Set(tagIds)] } } }),
    ]);
    if (categories !== new Set(categoryIds).size || tags !== new Set(tagIds).size)
      throw new BadRequestException({
        code: "BLOG_TAXONOMY_INVALID",
        message: "One or more selected categories or tags are unavailable.",
      });
  }
  private async revision(
    transaction: Prisma.TransactionClient,
    post: {
      id: string;
      title: string;
      slug: string;
      excerpt: string;
      content: Prisma.JsonValue;
      contentFormat: "STRUCTURED_BLOCKS";
      status: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
      seoTitle: string | null;
      seoDescription: string | null;
      featuredMediaId: string | null;
    },
    actorUserId: string,
    categoryIds: readonly string[],
    tagIds: readonly string[],
  ) {
    const latest = await transaction.blogPostRevision.aggregate({
      where: { postId: post.id },
      _max: { revisionNumber: true },
    });
    const revisionNumber = (latest._max.revisionNumber ?? 0) + 1;
    await transaction.blogPostRevision.create({
      data: {
        postId: post.id,
        revisionNumber,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content as Prisma.InputJsonValue,
        contentFormat: post.contentFormat,
        statusSnapshot: post.status,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        featuredMediaId: post.featuredMediaId,
        categoryIdsSnapshot: [...categoryIds],
        tagIdsSnapshot: [...tagIds],
        actorUserId,
      },
    });
    return revisionNumber;
  }

  async list(query: BlogPostListQuery, identity: AuthenticatedIdentity) {
    const readAll = hasPermission(identity.permissions, PERMISSION_KEYS.BLOG_POSTS_READ_ALL);
    if (!readAll && !hasPermission(identity.permissions, PERMISSION_KEYS.BLOG_POSTS_READ_OWN))
      throw new ForbiddenException({ code: "FORBIDDEN", message: "You cannot read blog posts." });
    const where: Prisma.BlogPostWhereInput = {
      ...(!readAll
        ? { authorUserId: identity.userId }
        : query.authorUserId
          ? { authorUserId: query.authorUserId }
          : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categories: { some: { categoryId: query.categoryId } } } : {}),
      ...(query.tagId ? { tags: { some: { tagId: query.tagId } } } : {}),
      ...(query.publishedFrom || query.publishedTo
        ? {
            publishedAt: {
              ...(query.publishedFrom
                ? { gte: new Date(`${query.publishedFrom}T00:00:00.000Z`) }
                : {}),
              ...(query.publishedTo ? { lte: new Date(`${query.publishedTo}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
      ...(query.scheduledFrom || query.scheduledTo
        ? {
            scheduledFor: {
              ...(query.scheduledFrom
                ? { gte: new Date(`${query.scheduledFrom}T00:00:00.000Z`) }
                : {}),
              ...(query.scheduledTo ? { lte: new Date(`${query.scheduledTo}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { excerpt: { contains: query.search, mode: "insensitive" } },
              { slug: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.database.client.$transaction([
      this.database.client.blogPost.findMany({
        where,
        include: postInclude,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.database.client.blogPost.count({ where }),
    ]);
    return {
      items: items.map((item) => this.adminResponse(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async get(id: string, identity: AuthenticatedIdentity) {
    const post = await this.find(id);
    this.authorize(
      identity,
      post.authorUserId,
      PERMISSION_KEYS.BLOG_POSTS_READ_OWN,
      PERMISSION_KEYS.BLOG_POSTS_READ_ALL,
    );
    return this.adminResponse(post);
  }

  async create(input: CreateBlogPostInput, identity: AuthenticatedIdentity) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.BLOG_POSTS_CREATE))
      throw new ForbiddenException({ code: "FORBIDDEN", message: "You cannot create blog posts." });
    await this.assertTaxonomy(input.categoryIds, input.tagIds);
    const mediaIds = [
      ...input.media.map(({ mediaId }) => mediaId),
      ...(input.featuredMediaId ? [input.featuredMediaId] : []),
      ...referencedBlogMedia(input.content),
    ];
    await this.media.validateOwned(mediaIds, identity);
    const conflict = await this.database.client.blogPost.findFirst({
      where: { OR: [{ slug: input.slug }, { redirects: { some: { oldSlug: input.slug } } }] },
      select: { id: true },
    });
    if (conflict)
      throw new ConflictException({
        code: "BLOG_SLUG_CONFLICT",
        message: "That blog slug or redirect is already in use.",
      });
    const post = await this.database.client.$transaction(async (transaction) => {
      const created = await transaction.blogPost.create({
        data: {
          slug: input.slug,
          title: input.title,
          excerpt: input.excerpt,
          content: input.content as Prisma.InputJsonValue,
          searchText: blogContentText(input.content),
          authorUserId: identity.userId,
          featuredMediaId: input.featuredMediaId ?? null,
          seoTitle: input.seoTitle || null,
          seoDescription: input.seoDescription || null,
          readingTimeMinutes: blogReadingTime(input.content),
          categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) },
          tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
          media: { create: input.media.map((item) => item) },
        },
      });
      await this.revision(transaction, created, identity.userId, input.categoryIds, input.tagIds);
      return created;
    });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_post.created",
      resourceType: "blog_post",
      resourceId: post.id,
      metadata: { slug: post.slug },
    });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_post.revision_created",
      resourceType: "blog_post",
      resourceId: post.id,
      metadata: { revisionNumber: 1 },
    });
    return this.get(post.id, identity);
  }

  async update(id: string, input: UpdateBlogPostInput, identity: AuthenticatedIdentity) {
    const current = await this.find(id);
    this.authorize(
      identity,
      current.authorUserId,
      PERMISSION_KEYS.BLOG_POSTS_UPDATE_OWN,
      PERMISSION_KEYS.BLOG_POSTS_UPDATE_ALL,
    );
    if (input.slug && input.slug !== current.slug) {
      const conflict = await this.database.client.blogPost.findFirst({
        where: {
          id: { not: id },
          OR: [{ slug: input.slug }, { redirects: { some: { oldSlug: input.slug } } }],
        },
        select: { id: true },
      });
      const redirectConflict = await this.database.client.blogSlugRedirect.findFirst({
        where: { oldSlug: input.slug, postId: { not: id } },
        select: { id: true },
      });
      if (conflict || redirectConflict)
        throw new ConflictException({
          code: "BLOG_SLUG_CONFLICT",
          message: "That blog slug or redirect is already in use.",
        });
    }
    const categoryIds = input.categoryIds ?? current.categories.map(({ categoryId }) => categoryId);
    const tagIds = input.tagIds ?? current.tags.map(({ tagId }) => tagId);
    const links =
      input.media ?? current.media.map(({ mediaId, sortOrder }) => ({ mediaId, sortOrder }));
    const content = input.content ?? (current.content as CreateBlogPostInput["content"]);
    const featuredMediaId =
      input.featuredMediaId === undefined ? current.featuredMediaId : input.featuredMediaId;
    await this.assertTaxonomy(categoryIds, tagIds);
    const mediaIds = [
      ...links.map(({ mediaId }) => mediaId),
      ...(featuredMediaId ? [featuredMediaId] : []),
      ...referencedBlogMedia(content),
    ];
    await this.media.validateOwned(mediaIds, identity);
    const oldMediaIds = this.allMediaIds(current);
    const updated = await this.database.client.$transaction(async (transaction) => {
      const result = await transaction.blogPost.updateMany({
        where: { id, version: input.version },
        data: {
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
          ...(input.content !== undefined
            ? {
                content: input.content as Prisma.InputJsonValue,
                searchText: blogContentText(input.content),
                readingTimeMinutes: blogReadingTime(input.content),
              }
            : {}),
          ...(input.featuredMediaId !== undefined
            ? { featuredMediaId: input.featuredMediaId }
            : {}),
          ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle || null } : {}),
          ...(input.seoDescription !== undefined
            ? { seoDescription: input.seoDescription || null }
            : {}),
          version: { increment: 1 },
        },
      });
      if (!result.count)
        throw new ConflictException({
          code: "BLOG_EDIT_CONFLICT",
          message: "This post changed elsewhere. Reload and review before saving again.",
        });
      if (input.slug && input.slug !== current.slug && current.publishedAt)
        await transaction.blogSlugRedirect.upsert({
          where: { oldSlug: current.slug },
          create: { oldSlug: current.slug, postId: id },
          update: { postId: id },
        });
      if (input.categoryIds) {
        await transaction.blogPostCategory.deleteMany({ where: { postId: id } });
        await transaction.blogPostCategory.createMany({
          data: categoryIds.map((categoryId) => ({ postId: id, categoryId })),
        });
      }
      if (input.tagIds) {
        await transaction.blogPostTag.deleteMany({ where: { postId: id } });
        await transaction.blogPostTag.createMany({
          data: tagIds.map((tagId) => ({ postId: id, tagId })),
        });
      }
      if (input.media) {
        await transaction.blogPostMedia.deleteMany({ where: { postId: id } });
        await transaction.blogPostMedia.createMany({
          data: links.map((item) => ({ postId: id, ...item })),
        });
      }
      const post = await transaction.blogPost.findUniqueOrThrow({ where: { id } });
      await this.revision(transaction, post, identity.userId, categoryIds, tagIds);
      return post;
    });
    if (current.status === "PUBLISHED") {
      await this.validatePublish(await this.find(id));
      await this.media.publish(mediaIds);
      await this.media.revokeUnused(
        oldMediaIds.filter((mediaId) => !mediaIds.includes(mediaId)),
        id,
      );
    }
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_post.updated",
      resourceType: "blog_post",
      resourceId: id,
      metadata: { changedFields: Object.keys(input).filter((key) => key !== "content") },
    });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_post.revision_created",
      resourceType: "blog_post",
      resourceId: id,
      metadata: { source: "save" },
    });
    return this.get(updated.id, identity);
  }

  private async validatePublish(post: IncludedPost) {
    const blocks = post.content as CreateBlogPostInput["content"];
    const referenced = referencedBlogMedia(blocks);
    const linked = new Set(post.media.map(({ mediaId }) => mediaId));
    if (
      !post.title.trim() ||
      !post.excerpt.trim() ||
      !blocks.length ||
      !post.featuredMedia ||
      !post.categories.length
    )
      throw new BadRequestException({
        code: "BLOG_PUBLISH_VALIDATION",
        message:
          "Publishing requires title, excerpt, content, featured image, and at least one category.",
      });
    if (!post.author.authorProfile?.displayName)
      throw new BadRequestException({
        code: "BLOG_AUTHOR_PROFILE_REQUIRED",
        message: "Complete the public author profile before publishing.",
      });
    if (!post.featuredMedia.altText.trim() || post.media.some(({ media }) => !media.altText.trim()))
      throw new BadRequestException({
        code: "BLOG_ALT_TEXT_REQUIRED",
        message: "Every featured or article image needs meaningful alt text.",
      });
    if (referenced.some((id) => !linked.has(id)))
      throw new BadRequestException({
        code: "BLOG_BROKEN_MEDIA_REFERENCE",
        message: "Every image block must reference media attached to this post.",
      });
  }

  async publish(id: string, version: number, identity: AuthenticatedIdentity) {
    const current = await this.find(id);
    this.authorize(
      identity,
      current.authorUserId,
      PERMISSION_KEYS.BLOG_POSTS_PUBLISH_OWN,
      PERMISSION_KEYS.BLOG_POSTS_PUBLISH_ALL,
    );
    if (!["DRAFT", "IN_REVIEW", "SCHEDULED"].includes(current.status))
      throw new ConflictException({
        code: "BLOG_TRANSITION_INVALID",
        message: "This post cannot be published from its current state.",
      });
    await this.validatePublish(current);
    await this.media.publish(this.allMediaIds(current));
    const updated = await this.database.client.blogPost.updateMany({
      where: { id, version },
      data: {
        status: "PUBLISHED",
        publishedAt: current.publishedAt ?? new Date(),
        scheduledFor: null,
        archivedAt: null,
        version: { increment: 1 },
      },
    });
    if (!updated.count)
      throw new ConflictException({
        code: "BLOG_EDIT_CONFLICT",
        message: "This post changed before publication.",
      });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_post.published",
      resourceType: "blog_post",
      resourceId: id,
      metadata: { previousStatus: current.status },
    });
    return this.get(id, identity);
  }

  async unpublish(id: string, version: number, identity: AuthenticatedIdentity) {
    const current = await this.find(id);
    this.authorize(
      identity,
      current.authorUserId,
      PERMISSION_KEYS.BLOG_POSTS_PUBLISH_OWN,
      PERMISSION_KEYS.BLOG_POSTS_PUBLISH_ALL,
    );
    if (current.status !== "PUBLISHED")
      throw new ConflictException({
        code: "BLOG_TRANSITION_INVALID",
        message: "Only a Published post can be unpublished.",
      });
    const updated = await this.database.client.blogPost.updateMany({
      where: { id, version },
      data: { status: "DRAFT", scheduledFor: null, version: { increment: 1 } },
    });
    if (!updated.count)
      throw new ConflictException({
        code: "BLOG_EDIT_CONFLICT",
        message: "This post changed before unpublication.",
      });
    await this.media.revokeUnused(this.allMediaIds(current), id);
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_post.unpublished",
      resourceType: "blog_post",
      resourceId: id,
    });
    return this.get(id, identity);
  }

  async schedule(id: string, input: ScheduleBlogPostInput, identity: AuthenticatedIdentity) {
    const current = await this.find(id);
    this.authorize(
      identity,
      current.authorUserId,
      PERMISSION_KEYS.BLOG_POSTS_SCHEDULE_OWN,
      PERMISSION_KEYS.BLOG_POSTS_SCHEDULE_ALL,
    );
    if (
      !["DRAFT", "IN_REVIEW", "SCHEDULED"].includes(current.status) ||
      new Date(input.scheduledFor) <= new Date()
    )
      throw new BadRequestException({
        code: "BLOG_SCHEDULE_INVALID",
        message: "Choose a future publication time for a Draft, In Review, or Scheduled post.",
      });
    await this.validatePublish(current);
    const updated = await this.database.client.blogPost.updateMany({
      where: { id, version: input.version },
      data: {
        status: "SCHEDULED",
        scheduledFor: new Date(input.scheduledFor),
        version: { increment: 1 },
      },
    });
    if (!updated.count)
      throw new ConflictException({
        code: "BLOG_EDIT_CONFLICT",
        message: "This post changed before scheduling.",
      });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_post.scheduled",
      resourceType: "blog_post",
      resourceId: id,
      metadata: { scheduledFor: input.scheduledFor },
    });
    return this.get(id, identity);
  }

  async submitReview(id: string, version: number, identity: AuthenticatedIdentity) {
    const current = await this.find(id);
    this.authorize(
      identity,
      current.authorUserId,
      PERMISSION_KEYS.BLOG_POSTS_UPDATE_OWN,
      PERMISSION_KEYS.BLOG_POSTS_UPDATE_ALL,
    );
    if (current.status !== "DRAFT")
      throw new ConflictException({
        code: "BLOG_TRANSITION_INVALID",
        message: "Only a Draft can be submitted for review.",
      });
    const updated = await this.database.client.blogPost.updateMany({
      where: { id, version },
      data: { status: "IN_REVIEW", version: { increment: 1 } },
    });
    if (!updated.count)
      throw new ConflictException({
        code: "BLOG_EDIT_CONFLICT",
        message: "This post changed before review submission.",
      });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_post.submitted_for_review",
      resourceType: "blog_post",
      resourceId: id,
    });
    return this.get(id, identity);
  }

  async archive(id: string, version: number, identity: AuthenticatedIdentity) {
    const current = await this.find(id);
    this.authorize(
      identity,
      current.authorUserId,
      PERMISSION_KEYS.BLOG_POSTS_ARCHIVE_OWN,
      PERMISSION_KEYS.BLOG_POSTS_ARCHIVE_ALL,
    );
    if (current.status === "ARCHIVED") return this.adminResponse(current);
    const updated = await this.database.client.blogPost.updateMany({
      where: { id, version },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        scheduledFor: null,
        version: { increment: 1 },
      },
    });
    if (!updated.count)
      throw new ConflictException({
        code: "BLOG_EDIT_CONFLICT",
        message: "This post changed before archival.",
      });
    if (current.status === "PUBLISHED")
      await this.media.revokeUnused(this.allMediaIds(current), id);
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_post.archived",
      resourceType: "blog_post",
      resourceId: id,
      metadata: { previousStatus: current.status },
    });
    return this.get(id, identity);
  }

  async remove(id: string, identity: AuthenticatedIdentity) {
    const current = await this.find(id);
    this.authorize(
      identity,
      current.authorUserId,
      PERMISSION_KEYS.BLOG_POSTS_DELETE_OWN,
      PERMISSION_KEYS.BLOG_POSTS_DELETE_ALL,
    );
    if (current.status !== "DRAFT")
      throw new ConflictException({
        code: "BLOG_DELETE_INVALID",
        message: "Only Draft posts can be permanently deleted.",
      });
    await this.database.client.blogPost.delete({ where: { id } });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_post.deleted",
      resourceType: "blog_post",
      resourceId: id,
      metadata: { slug: current.slug },
    });
    return { success: true };
  }

  async revisions(id: string, identity: AuthenticatedIdentity) {
    const post = await this.find(id);
    this.authorize(
      identity,
      post.authorUserId,
      PERMISSION_KEYS.BLOG_REVISIONS_READ_OWN,
      PERMISSION_KEYS.BLOG_REVISIONS_READ_ALL,
    );
    return this.database.client.blogPostRevision.findMany({
      where: { postId: id },
      orderBy: { revisionNumber: "desc" },
      select: {
        id: true,
        revisionNumber: true,
        title: true,
        excerpt: true,
        content: true,
        statusSnapshot: true,
        seoTitle: true,
        seoDescription: true,
        createdAt: true,
        actor: { select: { displayName: true } },
      },
    });
  }

  async restoreRevision(
    id: string,
    revisionId: string,
    version: number,
    identity: AuthenticatedIdentity,
  ) {
    const current = await this.find(id);
    this.authorize(
      identity,
      current.authorUserId,
      PERMISSION_KEYS.BLOG_POSTS_UPDATE_OWN,
      PERMISSION_KEYS.BLOG_POSTS_UPDATE_ALL,
    );
    this.authorize(
      identity,
      current.authorUserId,
      PERMISSION_KEYS.BLOG_REVISIONS_READ_OWN,
      PERMISSION_KEYS.BLOG_REVISIONS_READ_ALL,
    );
    const snapshot = await this.database.client.blogPostRevision.findFirst({
      where: { id: revisionId, postId: id },
    });
    if (!snapshot)
      throw new NotFoundException({
        code: "BLOG_REVISION_NOT_FOUND",
        message: "The blog revision was not found.",
      });
    const categoryIds = Array.isArray(snapshot.categoryIdsSnapshot)
      ? snapshot.categoryIdsSnapshot.filter((value): value is string => typeof value === "string")
      : [];
    const tagIds = Array.isArray(snapshot.tagIdsSnapshot)
      ? snapshot.tagIdsSnapshot.filter((value): value is string => typeof value === "string")
      : [];
    await this.assertTaxonomy(categoryIds, tagIds);
    const parsedContent = blogContentSchema.safeParse(snapshot.content);
    if (!parsedContent.success)
      throw new ConflictException({
        code: "BLOG_REVISION_INVALID",
        message: "This historical revision is not compatible with the current safe content format.",
      });
    const content = parsedContent.data;
    const mediaIds = [
      ...referencedBlogMedia(content),
      ...(snapshot.featuredMediaId ? [snapshot.featuredMediaId] : []),
    ];
    await this.media.validateOwned(mediaIds, identity);
    const slugConflict = await this.database.client.blogPost.findFirst({
      where: {
        id: { not: id },
        OR: [{ slug: snapshot.slug }, { redirects: { some: { oldSlug: snapshot.slug } } }],
      },
      select: { id: true },
    });
    if (slugConflict)
      throw new ConflictException({
        code: "BLOG_SLUG_CONFLICT",
        message: "The historical slug is now used by another post.",
      });
    const restored = await this.database.client.$transaction(async (transaction) => {
      const updated = await transaction.blogPost.updateMany({
        where: { id, version },
        data: {
          title: snapshot.title,
          slug: snapshot.slug,
          excerpt: snapshot.excerpt,
          content: snapshot.content as Prisma.InputJsonValue,
          searchText: blogContentText(content),
          status: "DRAFT",
          featuredMediaId: snapshot.featuredMediaId,
          seoTitle: snapshot.seoTitle,
          seoDescription: snapshot.seoDescription,
          scheduledFor: null,
          archivedAt: null,
          readingTimeMinutes: blogReadingTime(content),
          version: { increment: 1 },
        },
      });
      if (!updated.count)
        throw new ConflictException({
          code: "BLOG_EDIT_CONFLICT",
          message: "This post changed before the revision could be restored.",
        });
      await transaction.blogPostCategory.deleteMany({ where: { postId: id } });
      await transaction.blogPostTag.deleteMany({ where: { postId: id } });
      await transaction.blogPostMedia.deleteMany({ where: { postId: id } });
      if (categoryIds.length)
        await transaction.blogPostCategory.createMany({
          data: categoryIds.map((categoryId) => ({ postId: id, categoryId })),
        });
      if (tagIds.length)
        await transaction.blogPostTag.createMany({
          data: tagIds.map((tagId) => ({ postId: id, tagId })),
        });
      if (mediaIds.length)
        await transaction.blogPostMedia.createMany({
          data: [...new Set(mediaIds)].map((mediaId, sortOrder) => ({
            postId: id,
            mediaId,
            sortOrder,
          })),
        });
      if (current.slug !== snapshot.slug) {
        await transaction.blogSlugRedirect.deleteMany({
          where: { oldSlug: snapshot.slug, postId: id },
        });
        if (current.publishedAt)
          await transaction.blogSlugRedirect.upsert({
            where: { oldSlug: current.slug },
            update: { postId: id },
            create: { oldSlug: current.slug, postId: id },
          });
      }
      const post = await transaction.blogPost.findUniqueOrThrow({ where: { id } });
      await this.revision(transaction, post, identity.userId, categoryIds, tagIds);
      return post;
    });
    if (current.status === "PUBLISHED")
      await this.media.revokeUnused(this.allMediaIds(current), id);
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_post.revision_restored",
      resourceType: "blog_post",
      resourceId: id,
      metadata: { revisionId, restoredAsVersion: restored.version },
    });
    return this.get(id, identity);
  }

  async publicList(query: PublicBlogPostListQuery) {
    const where: Prisma.BlogPostWhereInput = {
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
      ...(query.category ? { categories: { some: { category: { slug: query.category } } } } : {}),
      ...(query.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {}),
      ...(query.author ? { author: { authorProfile: { slug: query.author } } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { excerpt: { contains: query.search, mode: "insensitive" } },
              { searchText: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.database.client.$transaction([
      this.database.client.blogPost.findMany({
        where,
        include: postInclude,
        orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.database.client.blogPost.count({ where }),
    ]);
    return {
      items: items.map((item) => this.publicResponse(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async publicGet(slug: string) {
    const post = await this.database.client.blogPost.findFirst({
      where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
      include: postInclude,
    });
    if (post) {
      const related = await this.database.client.blogPost.findMany({
        where: {
          id: { not: post.id },
          status: "PUBLISHED",
          OR: [
            {
              categories: {
                some: { categoryId: { in: post.categories.map(({ categoryId }) => categoryId) } },
              },
            },
            { tags: { some: { tagId: { in: post.tags.map(({ tagId }) => tagId) } } } },
          ],
        },
        include: postInclude,
        orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
        take: 3,
      });
      return {
        post: this.publicResponse(post),
        related: related.map((item) => this.publicResponse(item)),
      };
    }
    const redirect = await this.database.client.blogSlugRedirect.findUnique({
      where: { oldSlug: slug },
      include: { post: true },
    });
    if (redirect?.post.status === "PUBLISHED") return { redirectTo: redirect.post.slug };
    throw new NotFoundException({
      code: "BLOG_POST_NOT_FOUND",
      message: "The article was not found.",
    });
  }

  async taxonomy() {
    const [categories, tags] = await Promise.all([
      this.database.client.blogCategory.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { posts: { where: { post: { status: "PUBLISHED" } } } } } },
      }),
      this.database.client.blogTag.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { posts: { where: { post: { status: "PUBLISHED" } } } } } },
      }),
    ]);
    return { categories, tags };
  }

  async manageCategory(
    id: string | null,
    input: BlogTaxonomyInput,
    identity: AuthenticatedIdentity,
  ) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.BLOG_CATEGORIES_MANAGE))
      throw new ForbiddenException({ code: "FORBIDDEN", message: "You cannot manage categories." });
    const normalizedName = input.name.toLocaleLowerCase("en-CA");
    const category = id
      ? await this.database.client.blogCategory.update({
          where: { id },
          data: { ...input, normalizedName },
        })
      : await this.database.client.blogCategory.create({ data: { ...input, normalizedName } });
    await this.audit.record({
      actorUserId: identity.userId,
      action: id ? "blog_category.updated" : "blog_category.created",
      resourceType: "blog_category",
      resourceId: category.id,
      metadata: { slug: category.slug },
    });
    return category;
  }
  async removeCategory(id: string, identity: AuthenticatedIdentity) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.BLOG_CATEGORIES_MANAGE))
      throw new ForbiddenException({ code: "FORBIDDEN", message: "You cannot manage categories." });
    if (await this.database.client.blogPostCategory.count({ where: { categoryId: id } }))
      throw new ConflictException({
        code: "BLOG_CATEGORY_REFERENCED",
        message: "Reassign posts before deleting this category.",
      });
    await this.database.client.blogCategory.delete({ where: { id } });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_category.deleted",
      resourceType: "blog_category",
      resourceId: id,
    });
    return { success: true };
  }
  async manageTag(id: string | null, input: BlogTagInput, identity: AuthenticatedIdentity) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.BLOG_TAGS_MANAGE))
      throw new ForbiddenException({ code: "FORBIDDEN", message: "You cannot manage tags." });
    const normalizedName = input.name.toLocaleLowerCase("en-CA");
    const tag = id
      ? await this.database.client.blogTag.update({
          where: { id },
          data: { ...input, normalizedName },
        })
      : await this.database.client.blogTag.create({ data: { ...input, normalizedName } });
    await this.audit.record({
      actorUserId: identity.userId,
      action: id ? "blog_tag.updated" : "blog_tag.created",
      resourceType: "blog_tag",
      resourceId: tag.id,
      metadata: { slug: tag.slug },
    });
    return tag;
  }
  async removeTag(id: string, identity: AuthenticatedIdentity) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.BLOG_TAGS_MANAGE))
      throw new ForbiddenException({ code: "FORBIDDEN", message: "You cannot manage tags." });
    if (await this.database.client.blogPostTag.count({ where: { tagId: id } }))
      throw new ConflictException({
        code: "BLOG_TAG_REFERENCED",
        message: "Remove this tag from posts before deleting it.",
      });
    await this.database.client.blogTag.delete({ where: { id } });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_tag.deleted",
      resourceType: "blog_tag",
      resourceId: id,
    });
    return { success: true };
  }

  async authors(identity: AuthenticatedIdentity) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.AUTHOR_PROFILES_READ))
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "You cannot read author profiles.",
      });
    return this.database.client.user.findMany({
      where: { status: "ACTIVE", roles: { some: { role: { key: "AUTHOR" } } } },
      select: {
        id: true,
        displayName: true,
        authorProfile: true,
        _count: { select: { blogPosts: { where: { status: "PUBLISHED" } } } },
      },
      orderBy: { displayName: "asc" },
    });
  }
  async updateAuthor(userId: string, input: AuthorProfileInput, identity: AuthenticatedIdentity) {
    const allowed =
      hasPermission(identity.permissions, PERMISSION_KEYS.AUTHOR_PROFILES_UPDATE_ALL) ||
      (identity.userId === userId &&
        hasPermission(identity.permissions, PERMISSION_KEYS.AUTHOR_PROFILES_UPDATE_OWN));
    if (!allowed)
      throw new NotFoundException({
        code: "AUTHOR_PROFILE_NOT_FOUND",
        message: "The author profile was not found.",
      });
    const current = await this.database.client.authorProfile.findUnique({ where: { userId } });
    if (input.profileMediaId) await this.media.validateOwned([input.profileMediaId], identity);
    const profile = await this.database.client.authorProfile.upsert({
      where: { userId },
      create: { userId, ...input, profileMediaId: input.profileMediaId ?? null },
      update: { ...input, profileMediaId: input.profileMediaId ?? null },
    });
    if (
      input.profileMediaId &&
      (await this.database.client.blogPost.count({
        where: { authorUserId: userId, status: "PUBLISHED" },
      }))
    )
      await this.media.publish([input.profileMediaId]);
    if (current?.profileMediaId && current.profileMediaId !== input.profileMediaId)
      await this.media.revokeUnused([current.profileMediaId], "");
    await this.audit.record({
      actorUserId: identity.userId,
      action: "author_profile.updated",
      resourceType: "author_profile",
      resourceId: profile.id,
      metadata: { userId, changedFields: Object.keys(input) },
    });
    return profile;
  }
  async publicAuthor(slug: string) {
    const profile = await this.database.client.authorProfile.findUnique({
      where: { slug },
      include: {
        profileMedia: { select: mediaSelect },
        user: {
          select: {
            blogPosts: {
              where: { status: "PUBLISHED" },
              include: postInclude,
              orderBy: { publishedAt: "desc" },
            },
          },
        },
      },
    });
    if (!profile)
      throw new NotFoundException({
        code: "AUTHOR_PROFILE_NOT_FOUND",
        message: "The author was not found.",
      });
    return {
      author: {
        slug: profile.slug,
        displayName: profile.displayName,
        bio: profile.bio,
        profileMedia: this.mediaResponse(profile.profileMedia),
      },
      posts: profile.user.blogPosts.map((post) => this.publicResponse(post)),
    };
  }

  async publishDue() {
    const due = await this.database.client.blogPost.findMany({
      where: { status: "SCHEDULED", scheduledFor: { lte: new Date() } },
      orderBy: [{ scheduledFor: "asc" }, { id: "asc" }],
      take: this.config.value.BLOG_SCHEDULE_BATCH_SIZE,
      include: postInclude,
    });
    let published = 0;
    let invalid = 0;
    for (const post of due) {
      try {
        await this.validatePublish(post);
        await this.media.publish(this.allMediaIds(post));
        const changed = await this.database.client.blogPost.updateMany({
          where: { id: post.id, status: "SCHEDULED", scheduledFor: { lte: new Date() } },
          data: {
            status: "PUBLISHED",
            publishedAt: post.publishedAt ?? new Date(),
            scheduledFor: null,
            version: { increment: 1 },
          },
        });
        if (changed.count) {
          published += 1;
          await this.audit.record({
            action: "blog_post.published",
            resourceType: "blog_post",
            resourceId: post.id,
            metadata: { source: "scheduler" },
          });
        }
      } catch {
        invalid += 1;
      }
    }
    return { examined: due.length, published, invalid };
  }
}
