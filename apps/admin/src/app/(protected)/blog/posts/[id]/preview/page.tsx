/* eslint-disable @next/next/no-img-element -- authenticated draft media proxy */
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { BlogBlock, BlogInlineContent, BlogPostAdmin } from "@/lib/blog-types";

export const metadata = { robots: { index: false, follow: false } };

export default async function Page({ params }: { readonly params: Promise<{ id: string }> }) {
  const identity = await currentIdentity();
  if (!identity || (!can(identity, "blogPosts.readOwn") && !can(identity, "blogPosts.readAll")))
    return <Forbidden />;
  const post = await adminApi<BlogPostAdmin>(`admin/blog/posts/${(await params).id}/preview`);
  const media = new Map(post.media.map(({ media }) => [media.id, media]));
  return (
    <article className="mx-auto max-w-3xl">
      <p className="mb-6 rounded-md border border-warning bg-warning/10 p-3 font-semibold">
        Private preview · {post.status}
      </p>
      <h1 className="text-4xl font-semibold">{post.title}</h1>
      <p className="mt-4 text-lg">{post.excerpt}</p>
      <div className="mt-8 grid gap-5">
        {post.content.map((block, index) => (
          <PreviewBlock block={block} key={index} media={media} />
        ))}
      </div>
    </article>
  );
}

function PreviewBlock({
  block,
  media,
}: {
  block: BlogBlock;
  media: Map<string, BlogPostAdmin["media"][number]["media"]>;
}) {
  if (block.type === "divider") return <hr />;
  if (block.type === "image" || block.type === "managedImage") {
    const image = media.get(block.mediaId);
    return image ? (
      <figure>
        <img
          alt={image.altText}
          className="w-full rounded-lg"
          src={`/api/blog-media/${image.id}/article-large`}
        />
        {image.caption ? <figcaption>{image.caption}</figcaption> : null}
      </figure>
    ) : (
      <p>Missing managed image.</p>
    );
  }
  if (block.type === "richText") {
    const content = <PreviewInline content={block.content} />;
    if (block.style === "heading2") return <h2 className="text-2xl font-semibold">{content}</h2>;
    if (block.style === "heading3") return <h3 className="text-xl font-semibold">{content}</h3>;
    if (block.style === "heading4") return <h4 className="text-lg font-semibold">{content}</h4>;
    if (block.style === "blockquote")
      return <blockquote className="border-l-4 pl-4">{content}</blockquote>;
    return <p>{content}</p>;
  }
  if (block.type === "richList") {
    const Tag = block.style === "bullet" ? "ul" : "ol";
    return (
      <Tag
        className={block.style === "bullet" ? "list-inside list-disc" : "list-inside list-decimal"}
      >
        {block.items.map((item, index) => (
          <li key={index}>
            <PreviewInline content={item} />
          </li>
        ))}
      </Tag>
    );
  }
  if (block.type === "bulletList" || block.type === "numberedList") {
    const Tag = block.type === "bulletList" ? "ul" : "ol";
    return (
      <Tag className="list-inside list-disc">
        {block.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </Tag>
    );
  }
  if (block.type === "heading2") return <h2 className="text-2xl font-semibold">{block.text}</h2>;
  if (block.type === "heading3") return <h3 className="text-xl font-semibold">{block.text}</h3>;
  if (block.type === "blockquote")
    return <blockquote className="border-l-4 pl-4">{block.text}</blockquote>;
  if (block.type === "link")
    return (
      <a className="underline" href={block.href}>
        {block.text}
      </a>
    );
  if (block.type === "callout")
    return (
      <aside className="rounded-lg bg-muted p-4">
        {block.title ? <strong>{block.title}</strong> : null}
        <p>{block.text}</p>
      </aside>
    );
  return "text" in block ? <p>{block.text}</p> : null;
}

function PreviewInline({ content }: { readonly content: readonly BlogInlineContent[] }) {
  return content.map((node, index) => {
    let rendered: React.ReactNode = node.text;
    for (const mark of node.marks) {
      if (mark.type === "bold") rendered = <strong>{rendered}</strong>;
      else if (mark.type === "italic") rendered = <em>{rendered}</em>;
      else if (mark.type === "underline") rendered = <u>{rendered}</u>;
      else if ("href" in mark)
        rendered = (
          <a className="underline" href={mark.href}>
            {rendered}
          </a>
        );
    }
    return <span key={index}>{rendered}</span>;
  });
}
