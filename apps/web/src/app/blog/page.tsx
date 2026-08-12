import { Button, Input, Label, Select } from "@ctps/ui/primitives";
import { Container, Section } from "@ctps/ui/layout";
import Link from "next/link";

import { BlogCard } from "@/components/blog";
import { PublicLayout } from "@/components/public-shell";
import { getBlogPosts, getBlogTaxonomy } from "@/lib/blog-api";
import { metadataFor } from "@/lib/seo";
import { getMarketingPage } from "@/lib/marketing-api";
import { PremiumHero } from "@/components/premium-hero";

export const dynamic = "force-dynamic";
export const metadata = metadataFor(
  "Blog",
  "Practical CTPS property-care articles for homes and businesses in British Columbia.",
  "/blog",
);
export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{
    search?: string;
    category?: string;
    tag?: string;
    page?: string;
  }>;
}) {
  const query = await searchParams;
  const [result, taxonomy, marketingPage] = await Promise.all([
    getBlogPosts({
      ...(query.search ? { search: query.search } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.tag ? { tag: query.tag } : {}),
      ...(/^[1-9]\d*$/.test(query.page ?? "") ? { page: query.page! } : {}),
    }),
    getBlogTaxonomy(),
    getMarketingPage("BLOG"),
  ]);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  return (
    <PublicLayout>
      {marketingPage?.publishedContent?.sections.find(
        (section) => section.type === "HERO_SLIDER",
      ) ? (
        <PremiumHero
          media={marketingPage.media}
          section={marketingPage.publishedContent!.sections.find(
            (section) => section.type === "HERO_SLIDER",
          )!}
        />
      ) : (
        <Section className="journal-index-hero">
          <Container>
            <p className="eyebrow">CTPS Journal</p>
            <h1 className="public-display">Property-care guidance</h1>
            <p>
              Published articles, practical maintenance context, and service preparation guidance.
            </p>
          </Container>
        </Section>
      )}
      <Section>
        <Container size="wide">
          <form className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-[1fr_14rem_14rem_auto]">
            <div>
              <Label htmlFor="article-search">Search articles</Label>
              <Input defaultValue={query.search} id="article-search" name="search" />
            </div>
            <div>
              <Label htmlFor="article-category">Category</Label>
              <Select defaultValue={query.category ?? ""} id="article-category" name="category">
                <option value="">All categories</option>
                {taxonomy.categories
                  .filter((item) => item._count.posts > 0)
                  .map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="article-tag">Tag</Label>
              <Select defaultValue={query.tag ?? ""} id="article-tag" name="tag">
                <option value="">All tags</option>
                {taxonomy.tags
                  .filter((item) => item._count.posts > 0)
                  .map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
              </Select>
            </div>
            <Button type="submit">Apply</Button>
          </form>
          <p aria-live="polite" className="mt-5 text-sm text-muted-foreground">
            {result.total} published {result.total === 1 ? "article" : "articles"} found.
          </p>
          {result.items.length ? (
            <div className="journal-index-layout">
              {result.items.map((post, index) => (
                <BlogCard featured={index === 0 && !query.page} key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed p-10 text-center">
              No published articles match this search.
            </p>
          )}
          {pages > 1 ? (
            <nav aria-label="Blog pagination" className="mt-10 flex justify-between">
              <Link
                aria-disabled={result.page <= 1}
                href={{
                  pathname: "/blog",
                  query: { ...query, page: Math.max(1, result.page - 1) },
                }}
              >
                Previous
              </Link>
              <span>
                Page {result.page} of {pages}
              </span>
              <Link
                aria-disabled={result.page >= pages}
                href={{
                  pathname: "/blog",
                  query: { ...query, page: Math.min(pages, result.page + 1) },
                }}
              >
                Next
              </Link>
            </nav>
          ) : null}
        </Container>
      </Section>
    </PublicLayout>
  );
}
