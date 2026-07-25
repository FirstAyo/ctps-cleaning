import type { MetadataRoute } from "next";
import { site } from "@/content/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/design-system",
        "/api/",
        "/request-a-quote/confirmation",
        "/estimate/results/",
      ],
    },
    sitemap: new URL("/sitemap.xml", site.url).toString(),
  };
}
