import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@ctps/database";
import type {
  MarketingPageRestoreInput,
  MarketingPageUpdateInput,
  NavigationUpdateInput,
  SiteSettingsUpdateInput,
} from "@ctps/validation";

import { AuditService } from "../auth/audit.service";
import { DatabaseService } from "../database/database.service";
import { systemMarketingPages, systemNavigation } from "./marketing-content";

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
function mediaUses(
  content: MarketingPageUpdateInput["draftContent"],
  lifecycle: "DRAFT" | "PUBLISHED",
) {
  return content.sections.flatMap((section, sectionIndex) => [
    ...section.mediaIds.map((mediaId, mediaIndex) => ({
      mediaId,
      usage: `${lifecycle}:${section.type}:${sectionIndex}:media:${mediaIndex}`,
      sortOrder: mediaIndex,
    })),
    ...("items" in section && section.items
      ? section.items.flatMap((item, itemIndex) =>
          item.mediaId
            ? [
                {
                  mediaId: item.mediaId,
                  usage: `${lifecycle}:${section.type}:${sectionIndex}:item:${itemIndex}`,
                  sortOrder: itemIndex,
                },
              ]
            : [],
        )
      : []),
  ]);
}

@Injectable()
export class MarketingService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async initialize(actorUserId: string) {
    let created = 0;
    let upgraded = 0;
    for (const definition of systemMarketingPages) {
      const exists = await this.database.client.marketingPage.findUnique({
        where: { pageKey: definition.pageKey },
        select: { id: true, version: true, draftContent: true },
      });
      if (exists) {
        const sections = (exists.draftContent as { sections?: Array<{ id?: string }> }).sections;
        const isUntouchedPhase11Placeholder =
          definition.pageKey !== "HOME" &&
          exists.version === 1 &&
          Array.isArray(sections) &&
          sections.length <= 3 &&
          sections.every(({ id }) => ["hero", "content", "final-cta", "areas"].includes(id ?? ""));
        if (isUntouchedPhase11Placeholder) {
          await this.database.client.$transaction(async (transaction) => {
            const revision = await transaction.marketingPageRevision.create({
              data: {
                pageId: exists.id,
                revisionNumber: 2,
                content: json(definition.content),
                seoSnapshot: {},
                createdByUserId: actorUserId,
              },
            });
            await transaction.marketingPage.update({
              where: { id: exists.id },
              data: {
                title: definition.title,
                navigationLabel: definition.navigationLabel ?? null,
                draftContent: json(definition.content),
                publishedContent: json(definition.content),
                publishedRevisionId: revision.id,
                updatedByUserId: actorUserId,
                publishedByUserId: actorUserId,
                publishedAt: new Date(),
                version: { increment: 1 },
              },
            });
          });
          upgraded += 1;
        }
        continue;
      }
      await this.database.client.$transaction(async (transaction) => {
        const page = await transaction.marketingPage.create({
          data: {
            pageKey: definition.pageKey,
            slug: definition.slug,
            title: definition.title,
            navigationLabel: definition.navigationLabel ?? null,
            pageType: definition.pageType,
            status: "PUBLISHED",
            draftContent: json(definition.content),
            publishedContent: json(definition.content),
            createdByUserId: actorUserId,
            updatedByUserId: actorUserId,
            publishedByUserId: actorUserId,
            publishedAt: new Date(),
          },
        });
        const revision = await transaction.marketingPageRevision.create({
          data: {
            pageId: page.id,
            revisionNumber: 1,
            content: json(definition.content),
            seoSnapshot: {},
            createdByUserId: actorUserId,
          },
        });
        await transaction.marketingPage.update({
          where: { id: page.id },
          data: { publishedRevisionId: revision.id },
        });
      });
      created += 1;
    }
    for (const [index, [systemKey, label, href]] of systemNavigation.entries())
      await this.database.client.navigationItem.upsert({
        where: { systemKey },
        create: { systemKey, label, href, sortOrder: index, updatedByUserId: actorUserId },
        update: {},
      });
    await this.database.client.siteSetting.upsert({
      where: { key: "PUBLIC_SITE" },
      create: {
        key: "PUBLIC_SITE",
        value: {
          brandTagline: "Clean Precision",
          primaryCtaLabel: "Request a Quote",
          footerDescription:
            "Residential and commercial property-care inquiries across six British Columbia communities.",
          contactEmail: "",
          contactPhone: "",
        },
        updatedByUserId: actorUserId,
      },
      update: {},
    });
    return { created, upgraded, total: systemMarketingPages.length };
  }

  list() {
    return this.database.client.marketingPage.findMany({
      orderBy: [{ pageType: "asc" }, { title: "asc" }],
      select: {
        pageKey: true,
        slug: true,
        title: true,
        pageType: true,
        status: true,
        version: true,
        updatedAt: true,
        publishedAt: true,
        updatedBy: { select: { displayName: true } },
      },
    });
  }

  async detail(pageKey: string) {
    const page = await this.database.client.marketingPage.findUnique({
      where: { pageKey },
      include: {
        revisions: {
          orderBy: { revisionNumber: "desc" },
          take: 20,
          select: {
            id: true,
            revisionNumber: true,
            createdAt: true,
            createdBy: { select: { displayName: true } },
          },
        },
        mediaReferences: {
          where: { usage: { startsWith: "PUBLISHED:" } },
          orderBy: { sortOrder: "asc" },
          include: { media: { include: { variants: true } } },
        },
      },
    });
    if (!page)
      throw new NotFoundException({
        code: "PAGE_NOT_FOUND",
        message: "The marketing page was not found.",
      });
    return page;
  }

  async published(pageKey: string) {
    const page = await this.database.client.marketingPage.findFirst({
      where: { pageKey, status: "PUBLISHED", publishedContent: { not: Prisma.JsonNull } },
      select: {
        pageKey: true,
        slug: true,
        title: true,
        publishedContent: true,
        seoTitle: true,
        seoDescription: true,
        ogTitle: true,
        ogDescription: true,
        socialImageId: true,
        publishedAt: true,
        mediaReferences: {
          orderBy: { sortOrder: "asc" },
          select: {
            media: { select: { id: true, altText: true, focalPointX: true, focalPointY: true } },
          },
        },
      },
    });
    if (!page)
      throw new NotFoundException({
        code: "PAGE_NOT_FOUND",
        message: "The published page was not found.",
      });
    return {
      ...page,
      media: page.mediaReferences.map(({ media }) => media),
      mediaReferences: undefined,
    };
  }

  async update(
    pageKey: string,
    input: MarketingPageUpdateInput,
    actorUserId: string,
    canManageSeo: boolean,
  ) {
    const uses = mediaUses(input.draftContent, "DRAFT");
    const ids = [...new Set(uses.map(({ mediaId }) => mediaId))];
    const projectIds = [
      ...new Set(
        input.draftContent.sections.flatMap((section) =>
          "projectIds" in section ? section.projectIds : [],
        ),
      ),
    ];
    const postIds = [
      ...new Set(
        input.draftContent.sections.flatMap((section) =>
          "postIds" in section ? section.postIds : [],
        ),
      ),
    ];
    if (ids.length) {
      const count = await this.database.client.publicMediaAsset.count({
        where: { id: { in: ids }, status: "READY" },
      });
      if (count !== ids.length)
        throw new ConflictException({
          code: "MEDIA_NOT_AVAILABLE",
          message: "One or more selected public images are unavailable.",
        });
    }
    if (projectIds.length) {
      const count = await this.database.client.beforeAfterProject.count({
        where: { id: { in: projectIds }, status: "PUBLISHED" },
      });
      if (count !== projectIds.length)
        throw new ConflictException({
          code: "PROJECT_NOT_AVAILABLE",
          message: "One or more selected projects are not Published.",
        });
    }
    if (postIds.length) {
      const count = await this.database.client.blogPost.count({
        where: { id: { in: postIds }, status: "PUBLISHED" },
      });
      if (count !== postIds.length)
        throw new ConflictException({
          code: "POST_NOT_AVAILABLE",
          message: "One or more selected articles are not Published.",
        });
    }
    const seoChanged = [
      input.seoTitle,
      input.seoDescription,
      input.ogTitle,
      input.ogDescription,
      input.socialImageId,
    ].some((value) => value !== undefined);
    if (seoChanged && !canManageSeo)
      throw new ForbiddenException({ code: "FORBIDDEN", message: "SEO permission is required." });
    const { page, mediaSelectionChanged } = await this.database.client.$transaction(
      async (transaction) => {
        const existing = await transaction.marketingPage.findUnique({
          where: { pageKey },
          select: {
            id: true,
            version: true,
            mediaReferences: {
              where: { usage: { startsWith: "DRAFT:" } },
              orderBy: [{ usage: "asc" }, { sortOrder: "asc" }],
              select: { mediaId: true, usage: true, sortOrder: true },
            },
          },
        });
        if (!existing)
          throw new NotFoundException({
            code: "PAGE_NOT_FOUND",
            message: "The marketing page was not found.",
          });
        if (existing.version !== input.version)
          throw new ConflictException({
            code: "VERSION_CONFLICT",
            message: "This page changed elsewhere. Refresh before saving.",
          });
        const result = await transaction.marketingPage.updateMany({
          where: { id: existing.id, version: input.version },
          data: {
            title: input.title,
            navigationLabel: input.navigationLabel ?? null,
            draftContent: json(input.draftContent),
            updatedByUserId: actorUserId,
            version: { increment: 1 },
            ...(canManageSeo
              ? {
                  seoTitle: input.seoTitle ?? null,
                  seoDescription: input.seoDescription ?? null,
                  ogTitle: input.ogTitle ?? null,
                  ogDescription: input.ogDescription ?? null,
                  socialImageId: input.socialImageId ?? null,
                }
              : {}),
          },
        });
        if (result.count !== 1)
          throw new ConflictException({
            code: "VERSION_CONFLICT",
            message: "This page changed elsewhere. Refresh before saving.",
          });
        await transaction.marketingPageMedia.deleteMany({
          where: { pageId: existing.id, usage: { startsWith: "DRAFT:" } },
        });
        if (uses.length)
          await transaction.marketingPageMedia.createMany({
            data: uses.map(({ mediaId, usage, sortOrder }) => ({
              pageId: existing.id,
              mediaId,
              usage,
              sortOrder,
            })),
          });
        await transaction.marketingPageRevision.create({
          data: {
            pageId: existing.id,
            revisionNumber: input.version + 1,
            content: json(input.draftContent),
            seoSnapshot: json({
              seoTitle: input.seoTitle ?? null,
              seoDescription: input.seoDescription ?? null,
              ogTitle: input.ogTitle ?? null,
              ogDescription: input.ogDescription ?? null,
              socialImageId: input.socialImageId ?? null,
            }),
            createdByUserId: actorUserId,
          },
        });
        return {
          page: await transaction.marketingPage.findUniqueOrThrow({ where: { id: existing.id } }),
          mediaSelectionChanged:
            JSON.stringify(existing.mediaReferences) !==
            JSON.stringify(
              [...uses].sort(
                (left, right) =>
                  left.usage.localeCompare(right.usage) || left.sortOrder - right.sortOrder,
              ),
            ),
        };
      },
    );
    await this.audit.record({
      actorUserId,
      action: "marketing_page.draft_saved",
      resourceType: "marketing_page",
      resourceId: page.id,
      metadata: {
        pageKey,
        sectionCount: input.draftContent.sections.length,
        version: page.version,
      },
    });
    if (mediaSelectionChanged)
      await this.audit.record({
        actorUserId,
        action: "marketing_page.media_selection_changed",
        resourceType: "marketing_page",
        resourceId: page.id,
        metadata: {
          pageKey,
          references: uses.map(({ mediaId, usage }) => ({ mediaId, usage })),
        },
      });
    return page;
  }

  async publish(pageKey: string, version: number, actorUserId: string) {
    const page = await this.database.client.$transaction(async (transaction) => {
      const existing = await transaction.marketingPage.findUnique({
        where: { pageKey },
        select: {
          id: true,
          version: true,
          draftContent: true,
          seoTitle: true,
          seoDescription: true,
          ogTitle: true,
          ogDescription: true,
          socialImageId: true,
        },
      });
      if (!existing)
        throw new NotFoundException({
          code: "PAGE_NOT_FOUND",
          message: "The marketing page was not found.",
        });
      if (existing.version !== version)
        throw new ConflictException({
          code: "VERSION_CONFLICT",
          message: "This page changed elsewhere. Refresh before publishing.",
        });
      const revision = await transaction.marketingPageRevision.create({
        data: {
          pageId: existing.id,
          revisionNumber: version + 1,
          content: existing.draftContent as Prisma.InputJsonValue,
          seoSnapshot: json({
            seoTitle: existing.seoTitle,
            seoDescription: existing.seoDescription,
            ogTitle: existing.ogTitle,
            ogDescription: existing.ogDescription,
            socialImageId: existing.socialImageId,
          }),
          createdByUserId: actorUserId,
        },
      });
      const content = existing.draftContent as MarketingPageUpdateInput["draftContent"];
      const publishedUses = mediaUses(content, "PUBLISHED");
      await transaction.marketingPageMedia.deleteMany({
        where: { pageId: existing.id, usage: { startsWith: "PUBLISHED:" } },
      });
      if (publishedUses.length)
        await transaction.marketingPageMedia.createMany({
          data: publishedUses.map(({ mediaId, usage, sortOrder }) => ({
            pageId: existing.id,
            mediaId,
            usage,
            sortOrder,
          })),
        });
      return transaction.marketingPage.update({
        where: { id: existing.id },
        data: {
          status: "PUBLISHED",
          publishedContent: existing.draftContent as Prisma.InputJsonValue,
          publishedRevisionId: revision.id,
          publishedByUserId: actorUserId,
          publishedAt: new Date(),
          version: { increment: 1 },
          updatedByUserId: actorUserId,
        },
      });
    });
    await this.audit.record({
      actorUserId,
      action: "marketing_page.published",
      resourceType: "marketing_page",
      resourceId: page.id,
      metadata: { pageKey, version: page.version },
    });
    return page;
  }

  async restore(
    pageKey: string,
    revisionId: string,
    input: MarketingPageRestoreInput,
    actorUserId: string,
  ) {
    const page = await this.database.client.$transaction(async (transaction) => {
      const existing = await transaction.marketingPage.findUnique({
        where: { pageKey },
        select: { id: true, version: true },
      });
      if (!existing)
        throw new NotFoundException({
          code: "PAGE_NOT_FOUND",
          message: "The marketing page was not found.",
        });
      if (existing.version !== input.version)
        throw new ConflictException({
          code: "VERSION_CONFLICT",
          message: "This page changed elsewhere. Refresh before restoring.",
        });
      const revision = await transaction.marketingPageRevision.findFirst({
        where: { id: revisionId, pageId: existing.id },
      });
      if (!revision)
        throw new NotFoundException({
          code: "REVISION_NOT_FOUND",
          message: "The page revision was not found.",
        });
      const restoredContent = revision.content as MarketingPageUpdateInput["draftContent"];
      const restoredUses = mediaUses(restoredContent, "DRAFT");
      const restoredMediaIds = [...new Set(restoredUses.map(({ mediaId }) => mediaId))];
      if (restoredMediaIds.length) {
        const availableMedia = await transaction.publicMediaAsset.count({
          where: { id: { in: restoredMediaIds }, status: "READY" },
        });
        if (availableMedia !== restoredMediaIds.length)
          throw new ConflictException({
            code: "MEDIA_NOT_AVAILABLE",
            message: "One or more images in this revision are no longer available.",
          });
      }
      await transaction.marketingPageRevision.create({
        data: {
          pageId: existing.id,
          revisionNumber: input.version + 1,
          content: revision.content as Prisma.InputJsonValue,
          seoSnapshot: revision.seoSnapshot as Prisma.InputJsonValue,
          createdByUserId: actorUserId,
        },
      });
      await transaction.marketingPageMedia.deleteMany({
        where: { pageId: existing.id, usage: { startsWith: "DRAFT:" } },
      });
      if (restoredUses.length)
        await transaction.marketingPageMedia.createMany({
          data: restoredUses.map(({ mediaId, usage, sortOrder }) => ({
            pageId: existing.id,
            mediaId,
            usage,
            sortOrder,
          })),
        });
      return transaction.marketingPage.update({
        where: { id: existing.id },
        data: {
          draftContent: revision.content as Prisma.InputJsonValue,
          version: { increment: 1 },
          updatedByUserId: actorUserId,
        },
      });
    });
    await this.audit.record({
      actorUserId,
      action: "marketing_page.revision_restored",
      resourceType: "marketing_page",
      resourceId: page.id,
      metadata: { pageKey, revisionId, version: page.version },
    });
    return page;
  }

  navigation() {
    return this.database.client.navigationItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { systemKey: "asc" }],
    });
  }
  async updateNavigation(input: NavigationUpdateInput, actorUserId: string) {
    await this.database.client.$transaction(async (transaction) => {
      for (const item of input.items) {
        const result = await transaction.navigationItem.updateMany({
          where: { systemKey: item.systemKey, version: item.version },
          data: {
            label: item.label,
            enabled: item.enabled,
            sortOrder: item.sortOrder,
            version: { increment: 1 },
            updatedByUserId: actorUserId,
          },
        });
        if (result.count !== 1)
          throw new ConflictException({
            code: "VERSION_CONFLICT",
            message: "Navigation changed elsewhere. Refresh before saving.",
          });
      }
    });
    await this.audit.record({
      actorUserId,
      action: "navigation.updated",
      resourceType: "navigation",
      metadata: { itemCount: input.items.length },
    });
    return this.navigation();
  }
  async settings() {
    return (
      (await this.database.client.siteSetting.findUnique({ where: { key: "PUBLIC_SITE" } }))
        ?.value ?? {}
    );
  }
  async updateSettings(input: SiteSettingsUpdateInput, actorUserId: string) {
    const record = await this.database.client.siteSetting.upsert({
      where: { key: "PUBLIC_SITE" },
      create: { key: "PUBLIC_SITE", value: json(input), updatedByUserId: actorUserId },
      update: { value: json(input), version: { increment: 1 }, updatedByUserId: actorUserId },
    });
    await this.audit.record({
      actorUserId,
      action: "site_settings.updated",
      resourceType: "site_settings",
      resourceId: record.id,
      metadata: { changedFields: Object.keys(input) },
    });
    return record.value;
  }
}
