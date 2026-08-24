import { permanentRedirect } from "next/navigation";

import { serviceAreas, services } from "@/content/site";

export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{ service?: string; area?: string; page?: string }>;
}) {
  const input = await searchParams;
  const query = new URLSearchParams();
  if (services.some(({ slug }) => slug === input.service)) query.set("service", input.service!);
  if (serviceAreas.some(({ slug }) => slug === input.area)) query.set("area", input.area!);
  if (/^[1-9]\d*$/.test(input.page ?? "")) query.set("page", input.page!);
  permanentRedirect(query.size ? `/projects?${query}` : "/projects");
}
