import type { MetadataRoute } from "next";
import { serviceAreas, services, site } from "@/content/site";
import { getPublishedProjects } from "@/lib/before-after-api";
import { getBlogPosts, getBlogTaxonomy } from "@/lib/blog-api";
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
  const [firstBlog, taxonomy] = await Promise.all([
    getBlogPosts({ pageSize: "24" }),
    getBlogTaxonomy(),
  ]);
  const projects = [...first.items];
  for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++)
    projects.push(...(await getPublishedProjects({ page: String(page), pageSize: "24" })).items);
  const posts = [...firstBlog.items];
  for (let page = 2; page <= Math.ceil(firstBlog.total / firstBlog.pageSize); page++)
    posts.push(...(await getBlogPosts({ page: String(page), pageSize: "24" })).items);
  const blogPaths = [
    ...posts.map((post) => `/blog/${post.slug}`),
    ...taxonomy.categories
      .filter((item) => item._count.posts > 0)
      .map((item) => `/blog/category/${item.slug}`),
    ...taxonomy.tags
      .filter((item) => item._count.posts > 0)
      .map((item) => `/blog/tag/${item.slug}`),
    ...new Set(
      posts.flatMap((post) => (post.author.slug ? [`/blog/author/${post.author.slug}`] : [])),
    ),
  ];
  return [
    ...paths,
    ...projects.map((project) => `/before-after/${project.slug}`),
    ...blogPaths,
  ].map((path) => ({
    url: new URL(path, site.url).toString(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
