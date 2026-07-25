import { notFound } from "next/navigation";
import { Forbidden } from "@/components/forbidden";
import {
  PricingVersionEditor,
  type PricingVersionDetail,
} from "@/components/pricing-version-editor";
import { AdminApiError, adminApi, can, currentIdentity } from "@/lib/admin-api";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "pricingVersions.read")) return <Forbidden />;
  const { id } = await params;
  let version: PricingVersionDetail;
  try {
    version = await adminApi(`admin/pricing/versions/${id}`);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }
  const diff = await adminApi<{
    against: { versionCode: string } | null;
    services: { serviceKey: string; changed?: boolean; change?: string }[];
  }>(`admin/pricing/versions/${id}/diff`);
  return (
    <div className="grid gap-6">
      <PricingVersionEditor identity={identity} version={version} />
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">Pricing diff</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Compared with {diff.against?.versionCode ?? "no earlier published or archived version"}.
        </p>
        <ul className="mt-3 grid gap-1 text-sm">
          {diff.services.map((item) => (
            <li key={item.serviceKey}>
              {item.serviceKey}: {item.change ?? (item.changed ? "changed" : "unchanged")}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
