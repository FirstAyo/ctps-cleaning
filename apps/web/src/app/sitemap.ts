import type { MetadataRoute } from "next";
import { serviceAreas, services, site } from "@/content/site";
export default function sitemap(): MetadataRoute.Sitemap {
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
  return paths.map((path) => ({
    url: new URL(path, site.url).toString(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
