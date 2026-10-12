import { adminApi } from "@/lib/admin-api";
import type { MarketingPage } from "@/lib/marketing-types";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Preview({
  params,
}: {
  readonly params: Promise<{ pageKey: string }>;
}) {
  const { pageKey } = await params;
  const page = await adminApi<MarketingPage>(`admin/pages/${encodeURIComponent(pageKey)}/preview`);
  return (
    <div className="preview-canvas">
      <header>
        <p className="eyebrow">Authenticated draft preview</p>
        <h1>{page.title}</h1>
        <p>Version {page.version} · not indexed · not cached</p>
      </header>
      {page.draftContent.sections
        .filter((section) => section.enabled)
        .map((section) => {
          const images = section.mediaIds
            .map((id) => page.media.find((item) => item.id === id))
            .filter((item) => item !== undefined);
          return (
            <section key={section.id}>
              <p className="eyebrow">{section.eyebrow ?? section.type.replaceAll("_", " ")}</p>
              <h2>{section.title}</h2>
              {section.body ? <p>{section.body}</p> : null}
              {images.length ? (
                <div className="preview-media-grid">
                  {images.map((image) => (
                    <figure key={image.id}>
                      <Image
                        alt={image.altText}
                        height={Math.min(image.height, 640)}
                        src={`/api/marketing-media/${image.id}/large`}
                        style={{ objectPosition: `${image.focalPointX}% ${image.focalPointY}%` }}
                        width={Math.min(image.width, 960)}
                      />
                      {image.caption ? <figcaption>{image.caption}</figcaption> : null}
                    </figure>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
    </div>
  );
}
