import "server-only";

export interface ManagedMedia {
  readonly id: string;
  readonly altText: string;
  readonly caption: string | null;
  readonly width: number;
  readonly height: number;
  readonly variants: Record<
    string,
    { readonly path: string; readonly width: number; readonly height: number }
  >;
}
export interface PublicProject {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly status: "PUBLISHED";
  readonly featured: boolean;
  readonly publishedAt: string;
  readonly completedAt: string | null;
  readonly serviceKey: string;
  readonly serviceAreaKey: string;
  readonly seoTitle: string | null;
  readonly seoDescription: string | null;
  readonly primaryBeforeMedia: ManagedMedia;
  readonly primaryAfterMedia: ManagedMedia;
  readonly supportingMedia: readonly {
    readonly id: string;
    readonly category: "BEFORE" | "AFTER" | "GALLERY";
    readonly sortOrder: number;
    readonly caption: string | null;
    readonly media: ManagedMedia;
  }[];
}
function apiUrl(path: string) {
  const base = process.env.API_URL;
  if (!base) return null;
  return new URL(path, base.endsWith("/") ? base : `${base}/`);
}
export async function getPublishedProjects(
  query: Record<string, string> = {},
): Promise<{ items: PublicProject[]; page: number; pageSize: number; total: number }> {
  const url = apiUrl("public/before-after-projects");
  if (!url) return { items: [], page: 1, pageSize: 12, total: 0 };
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return { items: [], page: 1, pageSize: 12, total: 0 };
    return (await response.json()) as {
      items: PublicProject[];
      page: number;
      pageSize: number;
      total: number;
    };
  } catch {
    return { items: [], page: 1, pageSize: 12, total: 0 };
  }
}
export async function getPublishedProject(slug: string): Promise<PublicProject | null> {
  const url = apiUrl(`public/before-after-projects/${encodeURIComponent(slug)}`);
  if (!url) return null;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as PublicProject;
  } catch {
    return null;
  }
}
