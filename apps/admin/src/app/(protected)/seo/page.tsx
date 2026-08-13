import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleAlert, Info, Search } from "@ctps/ui/icons";

import { adminApi } from "@/lib/admin-api";

interface SeoIssue {
  readonly code: string;
  readonly severity: "ERROR" | "WARNING" | "INFO";
  readonly message: string;
  readonly label: string;
  readonly path: string;
  readonly type: string;
  readonly editorHref: string;
}

interface SeoPage {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly type: string;
  readonly seoTitle: string;
  readonly description: string;
  readonly hasSocialImage: boolean;
  readonly updatedAt: string;
  readonly editorHref: string;
  readonly issues: readonly SeoIssue[];
}

interface SeoOverview {
  readonly generatedAt: string;
  readonly summary: {
    readonly published: number;
    readonly errors: number;
    readonly warnings: number;
    readonly information: number;
    readonly missingTitles: number;
    readonly missingDescriptions: number;
    readonly missingImages: number;
    readonly redirects: number;
    readonly sitemapUrls: number;
  };
  readonly issues: readonly SeoIssue[];
  readonly pages: readonly SeoPage[];
}

const filters = [
  "ALL",
  "ERROR",
  "WARNING",
  "MARKETING",
  "SERVICE",
  "SERVICE_AREA",
  "BLOG",
  "PROJECT",
  "MISSING_TITLE",
  "MISSING_DESCRIPTION",
  "MISSING_IMAGE",
] as const;

export default async function SeoPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ filter?: string; query?: string }>;
}) {
  const [overview, query] = await Promise.all([
    adminApi<SeoOverview>("admin/seo/overview"),
    searchParams,
  ]);
  const filter = filters.includes(query.filter as (typeof filters)[number]) ? query.filter! : "ALL";
  const search = query.query?.trim().toLocaleLowerCase() ?? "";
  const pages = overview.pages.filter((page) => {
    if (
      search &&
      !`${page.label} ${page.path} ${page.seoTitle}`.toLocaleLowerCase().includes(search)
    )
      return false;
    if (filter === "ALL") return true;
    if (["ERROR", "WARNING"].includes(filter))
      return page.issues.some(({ severity }) => severity === filter);
    if (filter === "MISSING_TITLE")
      return page.issues.some(({ code }) => code === "MISSING_CUSTOM_TITLE");
    if (filter === "MISSING_DESCRIPTION")
      return page.issues.some(({ code }) => code === "MISSING_CUSTOM_DESCRIPTION");
    if (filter === "MISSING_IMAGE")
      return page.issues.some(({ code }) => code === "MISSING_SOCIAL_IMAGE");
    return page.type === filter;
  });
  const metrics = [
    ["Published content", overview.summary.published],
    ["Errors", overview.summary.errors],
    ["Warnings", overview.summary.warnings],
    ["Missing descriptions", overview.summary.missingDescriptions],
    ["Missing social images", overview.summary.missingImages],
    ["Sitemap URLs", overview.summary.sitemapUrls],
  ] as const;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Search readiness
        </p>
        <h1 className="text-3xl font-semibold">SEO health</h1>
        <p className="max-w-3xl text-muted-foreground">
          Deterministic checks of published CTPS content. Guidance is approximate and does not
          predict search-engine display or ranking.
        </p>
      </header>

      <section
        aria-label="SEO summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
      >
        {metrics.map(([label, value]) => (
          <article className="rounded-xl border bg-card p-4" key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </section>

      <form
        aria-label="Filter SEO audit"
        className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)_auto]"
      >
        <label className="space-y-1 text-sm font-medium">
          <span>Filter</span>
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            defaultValue={filter}
            name="filter"
          >
            {filters.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ").toLocaleLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          <span>Search pages</span>
          <input
            className="h-10 w-full rounded-md border bg-background px-3"
            defaultValue={query.query}
            name="query"
            placeholder="Title or path"
            type="search"
          />
        </label>
        <button
          className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
          type="submit"
        >
          <Search aria-hidden="true" size={16} />
          Apply
        </button>
      </form>

      <section aria-labelledby="seo-audit-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold" id="seo-audit-heading">
              Published page audit
            </h2>
            <p className="text-sm text-muted-foreground">{pages.length} matching pages</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(overview.generatedAt).toLocaleString("en-CA")}
          </p>
        </div>
        {pages.length ? (
          pages.map((page) => (
            <article
              className="grid gap-4 rounded-xl border bg-card p-4 lg:grid-cols-[minmax(13rem,1fr)_minmax(14rem,1.4fr)_auto]"
              key={page.id}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {page.type.replaceAll("_", " ")}
                </p>
                <h3 className="mt-1 font-semibold">{page.label}</h3>
                <code className="mt-1 block break-all text-xs">{page.path}</code>
              </div>
              <div className="space-y-2">
                <p className="font-medium">{page.seoTitle}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {page.description || "No description fallback is available."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Social image: {page.hasSocialImage ? "configured" : "missing"}
                </p>
              </div>
              <div className="min-w-48 space-y-2">
                {page.issues.length ? (
                  page.issues
                    .slice(0, 3)
                    .map((issue) => <Issue key={`${page.id}-${issue.code}`} issue={issue} />)
                ) : (
                  <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 aria-hidden="true" size={16} />
                    No current findings
                  </p>
                )}
                {page.issues.length > 3 ? (
                  <p className="text-xs text-muted-foreground">
                    +{page.issues.length - 3} more findings
                  </p>
                ) : null}
                <Link
                  className="inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  href={page.editorHref}
                >
                  Open editor<span className="sr-only"> for {page.label}</span>
                </Link>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            No published pages match these filters.
          </p>
        )}
      </section>
    </div>
  );
}

function Issue({ issue }: { readonly issue: SeoIssue }) {
  const Icon =
    issue.severity === "ERROR" ? CircleAlert : issue.severity === "WARNING" ? AlertTriangle : Info;
  return (
    <p className="flex gap-2 text-sm">
      <Icon aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
      <span>
        <strong>{issue.severity.toLocaleLowerCase()}:</strong> {issue.message}
      </span>
    </p>
  );
}
