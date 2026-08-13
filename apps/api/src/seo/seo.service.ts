import { Inject, Injectable } from "@nestjs/common";
import {
  CTPS_SERVICE_AREA_KEYS,
  CTPS_SERVICE_KEYS,
  extractInternalLinks,
  normalizeAuditText,
} from "@ctps/seo";
import { Prisma } from "@ctps/database";

import { DatabaseService } from "../database/database.service";

type Severity = "ERROR" | "WARNING" | "INFO";
type ContentType = "MARKETING" | "SERVICE" | "SERVICE_AREA" | "BLOG" | "PROJECT";

interface SeoIssue {
  readonly code: string;
  readonly severity: Severity;
  readonly message: string;
}

interface SeoAuditRecord {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly type: ContentType;
  readonly status: "PUBLISHED";
  readonly seoTitle: string;
  readonly description: string;
  readonly hasCustomTitle: boolean;
  readonly hasCustomDescription: boolean;
  readonly hasSocialImage: boolean;
  readonly updatedAt: string;
  readonly editorHref: string;
  readonly text: string;
  readonly links: readonly string[];
  readonly issues: SeoIssue[];
}

const fixedPublicPaths = [
  "/",
  "/services",
  "/residential",
  "/commercial",
  "/service-areas",
  "/about",
  "/contact",
  "/before-after",
  "/blog",
  "/faq",
  "/request-a-quote",
  "/estimate",
  "/privacy",
  "/terms",
  "/accessibility",
  ...CTPS_SERVICE_KEYS.map((key) => `/services/${key}`),
  ...CTPS_SERVICE_AREA_KEYS.map((key) => `/service-areas/${key}`),
] as const;

function visibleText(value: unknown): string {
  const pieces: string[] = [];
  const nonContentKeys = new Set([
    "id",
    "key",
    "type",
    "href",
    "mediaId",
    "mediaIds",
    "projectIds",
    "postIds",
  ]);
  const visit = (item: unknown): void => {
    if (typeof item === "string") pieces.push(item);
    else if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === "object")
      Object.entries(item).forEach(([key, child]) => {
        if (!nonContentKeys.has(key)) visit(child);
      });
  };
  visit(value);
  return pieces.join(" ");
}

function baseIssues(record: SeoAuditRecord): SeoIssue[] {
  const issues: SeoIssue[] = [];
  if (!record.hasCustomTitle)
    issues.push({
      code: "MISSING_CUSTOM_TITLE",
      severity: "WARNING",
      message: "Uses a title fallback; add a deliberate SEO title.",
    });
  if (!record.hasCustomDescription)
    issues.push({
      code: "MISSING_CUSTOM_DESCRIPTION",
      severity: "WARNING",
      message: "Uses a description fallback; add a deliberate meta description.",
    });
  if (!record.hasSocialImage)
    issues.push({
      code: "MISSING_SOCIAL_IMAGE",
      severity: "WARNING",
      message: "No eligible social image is configured.",
    });
  if (record.seoTitle.length < 20)
    issues.push({
      code: "SHORT_TITLE",
      severity: "INFO",
      message: "The title may provide too little context.",
    });
  if (record.seoTitle.length > 65)
    issues.push({
      code: "LONG_TITLE",
      severity: "WARNING",
      message: "The title may be truncated in search results.",
    });
  if (record.description.length > 165)
    issues.push({
      code: "LONG_DESCRIPTION",
      severity: "INFO",
      message: "The description may be truncated in search results.",
    });
  if (normalizeAuditText(record.text).split(" ").filter(Boolean).length < 45)
    issues.push({
      code: "THIN_CONTENT",
      severity: "WARNING",
      message: "Published reader-visible content is unusually brief; review it editorially.",
    });
  return issues;
}

function addDuplicateIssues(
  records: SeoAuditRecord[],
  field: "seoTitle" | "description",
  code: string,
): void {
  const groups = new Map<string, SeoAuditRecord[]>();
  for (const record of records) {
    const normalized = normalizeAuditText(record[field]);
    if (!normalized) continue;
    groups.set(normalized, [...(groups.get(normalized) ?? []), record]);
  }
  for (const duplicates of groups.values()) {
    if (duplicates.length < 2) continue;
    for (const record of duplicates)
      record.issues.push({
        code,
        severity: "WARNING",
        message: `${field === "seoTitle" ? "SEO title" : "Meta description"} duplicates ${duplicates.length - 1} other published item(s).`,
      });
  }
}

@Injectable()
export class SeoService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async overview() {
    const now = new Date();
    const [marketing, posts, projects, redirects, categoryCount, navigation] = await Promise.all([
      this.database.client.marketingPage.findMany({
        where: { status: "PUBLISHED", publishedContent: { not: Prisma.JsonNull } },
        select: {
          id: true,
          pageKey: true,
          slug: true,
          title: true,
          pageType: true,
          publishedContent: true,
          seoTitle: true,
          seoDescription: true,
          socialImageId: true,
          updatedAt: true,
          socialImage: { select: { status: true, altText: true } },
        },
        orderBy: { slug: "asc" },
      }),
      this.database.client.blogPost.findMany({
        where: { status: "PUBLISHED", publishedAt: { lte: now } },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          content: true,
          seoTitle: true,
          seoDescription: true,
          featuredMediaId: true,
          updatedAt: true,
          featuredMedia: { select: { altText: true, visibility: true, status: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.database.client.beforeAfterProject.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          description: true,
          seoTitle: true,
          seoDescription: true,
          primaryAfterMediaId: true,
          updatedAt: true,
          primaryAfterMedia: { select: { altText: true, visibility: true, status: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.database.client.blogSlugRedirect.count(),
      this.database.client.blogCategory.count({
        where: {
          posts: {
            some: { post: { status: "PUBLISHED", publishedAt: { lte: now } } },
          },
        },
      }),
      this.database.client.navigationItem.findMany({
        where: { enabled: true },
        select: { href: true },
      }),
    ]);

    const records: SeoAuditRecord[] = [
      ...marketing.map((page) => {
        const type: ContentType =
          page.pageType === "SERVICE"
            ? "SERVICE"
            : page.pageType === "AREA"
              ? "SERVICE_AREA"
              : "MARKETING";
        const text = visibleText(page.publishedContent);
        const record: SeoAuditRecord = {
          id: page.id,
          label: page.title,
          path: page.slug,
          type,
          status: "PUBLISHED",
          seoTitle: page.seoTitle ?? page.title,
          description: page.seoDescription ?? text.slice(0, 165),
          hasCustomTitle: Boolean(page.seoTitle),
          hasCustomDescription: Boolean(page.seoDescription),
          hasSocialImage: Boolean(page.socialImageId && page.socialImage),
          updatedAt: page.updatedAt.toISOString(),
          editorHref: `/pages/${page.pageKey}`,
          text,
          links: extractInternalLinks(page.publishedContent),
          issues: [],
        };
        record.issues.push(...baseIssues(record));
        if (page.socialImage && page.socialImage.status === "ARCHIVED")
          record.issues.push({
            code: "ARCHIVED_SOCIAL_IMAGE",
            severity: "WARNING",
            message: "The configured social image is archived.",
          });
        if (page.socialImage && !page.socialImage.altText.trim())
          record.issues.push({
            code: "MISSING_IMAGE_ALT",
            severity: "WARNING",
            message: "The social image is missing useful alternative text.",
          });
        return record;
      }),
      ...posts.map((post) => {
        const record: SeoAuditRecord = {
          id: post.id,
          label: post.title,
          path: `/blog/${post.slug}`,
          type: "BLOG",
          status: "PUBLISHED",
          seoTitle: post.seoTitle ?? post.title,
          description: post.seoDescription ?? post.excerpt,
          hasCustomTitle: Boolean(post.seoTitle),
          hasCustomDescription: Boolean(post.seoDescription),
          hasSocialImage: Boolean(
            post.featuredMediaId && post.featuredMedia?.visibility === "PUBLIC",
          ),
          updatedAt: post.updatedAt.toISOString(),
          editorHref: `/blog/posts/${post.id}`,
          text: `${post.title} ${post.excerpt} ${visibleText(post.content)}`,
          links: extractInternalLinks(post.content),
          issues: [],
        };
        record.issues.push(...baseIssues(record));
        if (post.featuredMedia && !post.featuredMedia.altText.trim())
          record.issues.push({
            code: "MISSING_IMAGE_ALT",
            severity: "WARNING",
            message: "The featured image is missing useful alternative text.",
          });
        return record;
      }),
      ...projects.map((project) => {
        const record: SeoAuditRecord = {
          id: project.id,
          label: project.title,
          path: `/before-after/${project.slug}`,
          type: "PROJECT",
          status: "PUBLISHED",
          seoTitle: project.seoTitle ?? project.title,
          description: project.seoDescription ?? project.summary,
          hasCustomTitle: Boolean(project.seoTitle),
          hasCustomDescription: Boolean(project.seoDescription),
          hasSocialImage: Boolean(
            project.primaryAfterMediaId && project.primaryAfterMedia?.visibility === "PUBLIC",
          ),
          updatedAt: project.updatedAt.toISOString(),
          editorHref: `/before-after/${project.id}`,
          text: `${project.title} ${project.summary} ${project.description}`,
          links: [],
          issues: [],
        };
        record.issues.push(...baseIssues(record));
        if (project.primaryAfterMedia && !project.primaryAfterMedia.altText.trim())
          record.issues.push({
            code: "MISSING_IMAGE_ALT",
            severity: "WARNING",
            message: "The primary After image is missing useful alternative text.",
          });
        return record;
      }),
    ];

    addDuplicateIssues(records, "seoTitle", "DUPLICATE_TITLE");
    addDuplicateIssues(records, "description", "DUPLICATE_DESCRIPTION");

    const knownPaths = new Set([...fixedPublicPaths, ...records.map(({ path }) => path)]);
    for (const record of records)
      for (const link of record.links)
        if (!knownPaths.has(link) && !link.startsWith("/media/"))
          record.issues.push({
            code: "BROKEN_INTERNAL_LINK",
            severity: "ERROR",
            message: `Internal destination ${link} is not a known public route.`,
          });

    const discoveryLinks = new Set([
      ...navigation.map(({ href }) => href),
      ...records.flatMap(({ links }) => links),
      ...records
        .filter(({ type }) => ["BLOG", "PROJECT", "SERVICE", "SERVICE_AREA"].includes(type))
        .map(({ path }) => path),
    ]);
    for (const record of records)
      if (record.path !== "/" && !discoveryLinks.has(record.path))
        record.issues.push({
          code: "ORPHAN_PAGE",
          severity: "WARNING",
          message: "No crawlable internal discovery path was found.",
        });

    for (const type of ["SERVICE", "SERVICE_AREA"] as const) {
      const groups = new Map<string, SeoAuditRecord[]>();
      for (const record of records.filter((item) => item.type === type)) {
        const normalized = normalizeAuditText(record.text);
        groups.set(normalized, [...(groups.get(normalized) ?? []), record]);
      }
      for (const duplicates of groups.values())
        if (duplicates.length > 1)
          for (const record of duplicates)
            record.issues.push({
              code: `${type}_DUPLICATE_CONTENT`,
              severity: "WARNING",
              message: `Published ${type === "SERVICE" ? "service" : "area"} content exactly duplicates another page.`,
            });
    }

    const issues = records.flatMap((record) =>
      record.issues.map((issue) => ({
        ...issue,
        recordId: record.id,
        label: record.label,
        path: record.path,
        type: record.type,
        editorHref: record.editorHref,
      })),
    );
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        published: records.length,
        errors: issues.filter(({ severity }) => severity === "ERROR").length,
        warnings: issues.filter(({ severity }) => severity === "WARNING").length,
        information: issues.filter(({ severity }) => severity === "INFO").length,
        missingTitles: issues.filter(({ code }) => code === "MISSING_CUSTOM_TITLE").length,
        missingDescriptions: issues.filter(({ code }) => code === "MISSING_CUSTOM_DESCRIPTION")
          .length,
        missingImages: issues.filter(({ code }) => code === "MISSING_SOCIAL_IMAGE").length,
        redirects,
        sitemapUrls: fixedPublicPaths.length + posts.length + projects.length + categoryCount,
      },
      issues,
      pages: records.map((record) => ({
        id: record.id,
        label: record.label,
        path: record.path,
        type: record.type,
        status: record.status,
        seoTitle: record.seoTitle,
        description: record.description,
        hasCustomTitle: record.hasCustomTitle,
        hasCustomDescription: record.hasCustomDescription,
        hasSocialImage: record.hasSocialImage,
        updatedAt: record.updatedAt,
        editorHref: record.editorHref,
        issues: record.issues,
      })),
    };
  }
}
