import { Forbidden } from "@/components/forbidden";
import { PricingVersionCreateForm } from "@/components/pricing-version-editor";
import { can, currentIdentity } from "@/lib/admin-api";
export default async function Page() {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "pricingVersions.create")) return <Forbidden />;
  return (
    <div>
      <h2 className="text-2xl font-semibold">Create pricing draft</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        A new version always starts as Draft and is never used publicly until validated and
        explicitly published.
      </p>
      <PricingVersionCreateForm />
    </div>
  );
}
