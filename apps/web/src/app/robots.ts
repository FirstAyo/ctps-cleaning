import type { MetadataRoute } from "next";
import { publicIndexingEnabled, site } from "@/content/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: publicIndexingEnabled
      ? {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/admin",
            "/design-system",
            "/api/",
            "/request-a-quote/confirmation",
            "/estimate/results/",
          ],
        }
      : { userAgent: "*", disallow: "/" },
    sitemap: new URL("/sitemap.xml", site.url).toString(),
  };
}
