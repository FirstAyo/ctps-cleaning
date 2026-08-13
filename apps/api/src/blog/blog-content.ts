import type { BlogContentBlockInput } from "@ctps/validation";

export function blogContentText(blocks: readonly BlogContentBlockInput[]): string {
  return blocks
    .flatMap((block) => {
      if (block.type === "richText") return block.content.map(({ text }) => text);
      if (block.type === "richList")
        return block.items.flatMap((item) => item.map(({ text }) => text));
      if ("text" in block) return [block.text];
      if ("items" in block) return block.items;
      return [];
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function blogReadingTime(blocks: readonly BlogContentBlockInput[]): number {
  const words = blogContentText(blocks).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function referencedBlogMedia(blocks: readonly BlogContentBlockInput[]): string[] {
  return [
    ...new Set(
      blocks.flatMap((block) =>
        block.type === "image" || block.type === "managedImage" ? [block.mediaId] : [],
      ),
    ),
  ];
}
