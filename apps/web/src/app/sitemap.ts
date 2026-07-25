import type { MetadataRoute } from "next";
import { serviceAreas, services, site } from "@/content/site";
import { getPublishedProjects } from "@/lib/before-after-api";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "/",
    "/services",
    ...services.map(({ slug }) => `/services/${slug}`),
    "/residential",
    "/commercial",
    "/before-after",
    "/service-areas",
    ...serviceAreas.map(({ slug }) => `/service-areas/${slug}`),
    "/about",
    "/contact",
    "/faq",
    "/blog",
    "/estimate",
    "/request-a-quote",
  ];
  const first = await getPublishedProjects({ pageSize: "24" });
  const projects = [...first.items];
  for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++)
    projects.push(...(await getPublishedProjects({ page: String(page), pageSize: "24" })).items);
  return [...paths, ...projects.map((project) => `/before-after/${project.slug}`)].map((path) => ({
    url: new URL(path, site.url).toString(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
