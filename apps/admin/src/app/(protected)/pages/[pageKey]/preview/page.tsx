import { adminApi } from "@/lib/admin-api";
import type { MarketingPage } from "@/lib/marketing-types";

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
        .map((section) => (
          <section key={section.id}>
            <p className="eyebrow">{section.eyebrow ?? section.type.replaceAll("_", " ")}</p>
            <h2>{section.title}</h2>
            {section.body ? <p>{section.body}</p> : null}
          </section>
        ))}
    </div>
  );
}
