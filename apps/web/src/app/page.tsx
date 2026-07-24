import { fetchFoundationHealth } from "@ctps/config";

import { FoundationPage } from "@/components/foundation-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const health = await fetchFoundationHealth(process.env);

  return <FoundationPage environment={process.env.NODE_ENV ?? "unknown"} health={health} />;
}
