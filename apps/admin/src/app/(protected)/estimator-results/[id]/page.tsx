import { notFound } from "next/navigation";
import { Forbidden } from "@/components/forbidden";
import { EstimatorResultArchive } from "@/components/pricing-version-editor";
import { AdminApiError, adminApi, can, currentIdentity } from "@/lib/admin-api";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "estimatorResults.read")) return <Forbidden />;
  const { id } = await params;
  let result: Record<string, unknown>;
  try {
    result = await adminApi(`admin/estimator-results/${id}`);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }
  const safe = Object.fromEntries(
    Object.entries(result).filter(([key]) => !["calculationTrace"].includes(key)),
  );
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Estimator result detail</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Historical inputs, output, version snapshot, expiry, and quote linkage.
        </p>
      </div>
      <dl className="grid gap-4 rounded-lg border bg-card p-5">
        <pre className="overflow-auto whitespace-pre-wrap text-xs">
          {JSON.stringify(safe, null, 2)}
        </pre>
      </dl>
      {can(identity, "estimatorResults.readCalculationTrace") && result.calculationTrace ? (
        <details className="rounded-lg border p-5">
          <summary className="font-semibold">Internal calculation trace</summary>
          <pre className="mt-4 overflow-auto text-xs">
            {JSON.stringify(result.calculationTrace, null, 2)}
          </pre>
        </details>
      ) : null}
      {can(identity, "estimatorResults.archive") ? <EstimatorResultArchive id={id} /> : null}
    </div>
  );
}
