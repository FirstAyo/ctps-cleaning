/* eslint-disable @next/next/no-img-element -- API-managed responsive media paths */
import { Container, Section } from "@ctps/ui/layout";
import Link from "next/link";

import type { PublicBlogBlock, PublicBlogMedia, PublicBlogPost } from "@/lib/blog-api";

const imagePath = (media: PublicBlogMedia, variant: string) => `/media/blog/${media.id}/${variant}`;
export function BlogCard({
  post,
  featured = false,
}: {
  readonly post: PublicBlogPost;
  readonly featured?: boolean;
}) {
  return (
    <article className={`journal-card${featured ? " journal-card-featured" : ""}`}>
      {post.featuredMedia ? (
        <Link href={`/blog/${post.slug}`}>
          <img
            alt={post.featuredMedia.altText}
            className="journal-card-image"
            loading="lazy"
            src={imagePath(post.featuredMedia, "featured")}
          />
        </Link>
      ) : null}
      <div className="journal-card-copy">
        <p className="journal-meta">
          {new Intl.DateTimeFormat("en-CA", { dateStyle: "long" }).format(
            new Date(post.publishedAt),
          )}{" "}
          · {post.readingTimeMinutes} min read
        </p>
        <h2>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p>{post.excerpt}</p>
        <p className="journal-byline">
          By{" "}
          {post.author.slug ? (
            <Link className="underline" href={`/blog/author/${post.author.slug}`}>
              {post.author.displayName}
            </Link>
          ) : (
            post.author.displayName
          )}
        </p>
      </div>
    </article>
  );
}
export function BlogListing({
  title,
  description,
  posts,
  image,
}: {
  readonly title: string;
  readonly description: string;
  readonly posts: readonly PublicBlogPost[];
  readonly image?: PublicBlogMedia | null;
}) {
  return (
    <>
      <Section className="bg-secondary/30">
        <Container>
          {image ? (
            <img
              alt={image.altText}
              className="mb-5 h-28 w-28 rounded-full object-cover"
              src={imagePath(image, "thumbnail")}
            />
          ) : null}
          <p className="text-sm font-bold uppercase tracking-widest text-primary">CTPS Journal</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>
        </Container>
      </Section>
      <Section>
        <Container size="wide">
          {posts.length ? (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <h2 className="text-2xl font-semibold">No published articles yet.</h2>
              <p className="mt-2 text-muted-foreground">
                Please check back after CTPS publishes its first article.
              </p>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
export function BlogArticle({
  post,
  related,
}: {
  readonly post: PublicBlogPost;
  readonly related: readonly PublicBlogPost[];
}) {
  const media = new Map(
    post.media.flatMap(({ media }) => (media ? [[media.id, media] as const] : [])),
  );
  return (
    <>
      <Section>
        <Container>
          <nav aria-label="Breadcrumb" className="text-sm">
            <Link href="/">Home</Link> / <Link href="/blog">Blog</Link> / <span>{post.title}</span>
          </nav>
          <article className="journal-article">
            <header className="journal-article-header">
              <p className="journal-meta">
                {new Intl.DateTimeFormat("en-CA", { dateStyle: "long" }).format(
                  new Date(post.publishedAt),
                )}{" "}
                · {post.readingTimeMinutes} min read
              </p>
              <h1>{post.title}</h1>
              <p className="journal-deck">{post.excerpt}</p>
              {post.featuredMedia ? (
                <img
                  alt={post.featuredMedia.altText}
                  className="journal-featured-image"
                  src={imagePath(post.featuredMedia, "featured")}
                />
              ) : null}
            </header>
            <div className="journal-article-body">
              <div className="prose prose-lg max-w-none">
                {post.content.map((block, index) => (
                  <PublicBlock block={block} key={index} media={media} />
                ))}
              </div>
              <footer className="journal-author-footer">
                <p>
                  Written by{" "}
                  {post.author.slug ? (
                    <Link
                      className="font-semibold underline"
                      href={`/blog/author/${post.author.slug}`}
                    >
                      {post.author.displayName}
                    </Link>
                  ) : (
                    <strong>{post.author.displayName}</strong>
                  )}
                </p>
                {post.author.bio ? (
                  <p className="mt-2 text-muted-foreground">{post.author.bio}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.categories.map((item) => (
                    <Link
                      className="rounded-full bg-secondary px-3 py-1 text-sm"
                      href={`/blog/category/${item.slug}`}
                      key={item.slug}
                    >
                      {item.name}
                    </Link>
                  ))}
                  {post.tags.map((item) => (
                    <Link
                      className="rounded-full border px-3 py-1 text-sm"
                      href={`/blog/tag/${item.slug}`}
                      key={item.slug}
                    >
                      #{item.name}
                    </Link>
                  ))}
                </div>
                <div className="journal-cta">
                  <h2 className="text-2xl font-semibold">Need a property-specific review?</h2>
                  <p className="mt-2">
                    Article guidance is general. CTPS can review your service request and property
                    details.
                  </p>
                  <Link
                    className="mt-4 inline-flex rounded-md bg-background px-4 py-3 font-semibold text-foreground"
                    href="/request-a-quote"
                  >
                    Request a quote
                  </Link>
                </div>
              </footer>
            </div>
          </article>
        </Container>
      </Section>
      {related.length ? (
        <Section className="bg-secondary/30">
          <Container size="wide">
            <h2 className="mb-6 text-3xl font-semibold">Related articles</h2>
            <div className="grid gap-7 md:grid-cols-3">
              {related.map((item) => (
                <BlogCard key={item.slug} post={item} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
function PublicBlock({
  block,
  media,
}: {
  block: PublicBlogBlock;
  media: Map<string, PublicBlogMedia>;
}) {
  if (block.type === "divider") return <hr />;
  if (block.type === "image") {
    const image = media.get(block.mediaId);
    return image ? (
      <figure>
        <img
          alt={image.altText}
          className="w-full rounded-xl"
          loading="lazy"
          src={imagePath(image, "article-large")}
        />
        {image.caption ? <figcaption>{image.caption}</figcaption> : null}
      </figure>
    ) : null;
  }
  if (block.type === "bulletList")
    return (
      <ul>
        {block.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  if (block.type === "numberedList")
    return (
      <ol>
        {block.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>
    );
  if (block.type === "heading2") return <h2>{block.text}</h2>;
  if (block.type === "heading3") return <h3>{block.text}</h3>;
  if (block.type === "blockquote") return <blockquote>{block.text}</blockquote>;
  if (block.type === "link") {
    const external = /^https?:\/\//i.test(block.href);
    return (
      <p>
        <a href={block.href} {...(external ? { rel: "noopener noreferrer" } : {})}>
          {block.text}
        </a>
      </p>
    );
  }
  if (block.type === "callout")
    return (
      <aside className="rounded-xl bg-secondary p-5">
        {block.title ? <h3>{block.title}</h3> : null}
        <p>{block.text}</p>
      </aside>
    );
  return "text" in block ? <p>{block.text}</p> : null;
}
