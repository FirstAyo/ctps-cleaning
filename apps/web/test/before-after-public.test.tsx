import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LegacyDetailPage from "../src/app/before-after/[slug]/page";
import LegacyListingPage from "../src/app/before-after/page";
import ProjectPage, { generateMetadata as projectMetadata } from "../src/app/projects/[slug]/page";
import ProjectsPage from "../src/app/projects/page";
import sitemap from "../src/app/sitemap";
import { ProjectCard, ProjectDetail } from "../src/components/portfolio";
import type { PublicProject, PublicProjectContext } from "../src/lib/before-after-api";

const media = (id: string, altText: string) => ({
  id,
  altText,
  caption: null,
  width: 800,
  height: 600,
  variants: {
    original: { path: `/media/before-after/${id}/original`, width: 800, height: 600 },
    thumbnail: { path: `/media/before-after/${id}/thumbnail`, width: 480, height: 360 },
    gallery: { path: `/media/before-after/${id}/gallery`, width: 800, height: 600 },
    large: { path: `/media/before-after/${id}/large`, width: 800, height: 600 },
  },
});

const published: PublicProject = {
  id: "project",
  slug: "window-restoration-vancouver",
  title: "Window restoration in Vancouver",
  summary: "A published exterior window transformation.",
  description: "The project was assessed carefully.\nThe final result was reviewed.",
  summaryContent: null,
  descriptionContent: null,
  status: "PUBLISHED",
  featured: true,
  publishedAt: "2026-07-24T00:00:00.000Z",
  updatedAt: "2026-07-25T00:00:00.000Z",
  completedAt: "2026-07-01T00:00:00.000Z",
  serviceKey: "window-cleaning",
  serviceAreaKey: "vancouver",
  seoTitle: "Published window restoration",
  seoDescription: "Accessible project detail.",
  primaryBeforeMedia: media("before", "Clouded glass before cleaning"),
  primaryAfterMedia: media("after", "Clear glass after cleaning"),
  coverMedia: null,
  supportingMedia: [
    {
      id: "support",
      category: "GALLERY",
      sortOrder: 0,
      caption: "Final inspection",
      media: media("support", "Clean window during final inspection"),
    },
  ],
};

const another = (id: string, serviceKey = "window-cleaning"): PublicProject => ({
  ...published,
  id,
  slug: `${id}-project`,
  title: `${id} project`,
  featured: false,
  serviceKey,
  coverMedia: media(`${id}-cover`, `${id} project cover`),
  supportingMedia: [],
});

const context: PublicProjectContext = {
  project: published,
  relatedProjects: [another("related")],
  moreProjects: [another("more", "pressure-washing")],
  previousProject: another("previous"),
  nextProject: another("next"),
};

beforeEach(() => vi.stubEnv("API_URL", "http://api.test/"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("public Projects portfolio", () => {
  it("renders Projects terminology and an honest zero-project state", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ items: [], page: 1, pageSize: 12, total: 0 })),
        ),
    );
    const html = renderToStaticMarkup(await ProjectsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Selected work.");
    expect(html).toContain("Projects will appear here as completed work is published");
    expect(html).toContain("0 projects");
    expect(html).not.toContain("published projects");
    expect(html).not.toContain("No project stories are currently published");
  });

  it("renders a Featured Project, service filter, cover fallback, and canonical project links", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [published], page: 1, pageSize: 12, total: 1 })),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const html = renderToStaticMarkup(await ProjectsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Featured Project");
    expect(html).toContain("Clear glass after cleaning");
    expect(html).toContain(`/projects/${published.slug}`);
    expect(html).toContain("All Projects");
    expect(html).not.toContain(`href="/before-after/${published.slug}"`);
  });

  it("passes validated service and area filtering to the central public API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ items: [published], page: 1, pageSize: 12, total: 1 })),
      );
    vi.stubGlobal("fetch", fetchMock);
    await ProjectsPage({
      searchParams: Promise.resolve({ service: "window-cleaning", area: "vancouver" }),
    });
    const requested = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(requested.searchParams.get("serviceKey")).toBe("window-cleaning");
    expect(requested.searchParams.get("serviceAreaKey")).toBe("vancouver");
  });

  it("uses a dedicated cover and otherwise falls back to the primary After image", () => {
    const dedicated = renderToStaticMarkup(
      <ProjectCard
        project={{ ...published, coverMedia: media("cover", "Dedicated project cover") }}
      />,
    );
    expect(dedicated).toContain("Dedicated project cover");
    expect(dedicated).not.toContain("Clouded glass before cleaning");
    const fallback = renderToStaticMarkup(<ProjectCard project={published} />);
    expect(fallback).toContain("Clear glass after cleaning");
  });

  it("marks the first unfeatured archive entry as the lead case study", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [{ ...published, featured: false }, another("second")],
            page: 1,
            pageSize: 12,
            total: 2,
          }),
        ),
      ),
    );
    const html = renderToStaticMarkup(await ProjectsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("project-tile-lead");
    expect(html).toContain("2 projects");
  });

  it("renders the case-study Hero, overview, transformation, story, gallery, sidebar, CTA, and neighbours", () => {
    const html = renderToStaticMarkup(<ProjectDetail context={context} />);
    expect(html).toContain("Home");
    expect(html).toContain("Projects");
    expect(html).toContain("Before &amp; After");
    expect(html).toContain("Project story");
    expect(html).toContain("Final inspection");
    expect(html).toContain("Related Projects");
    expect(html).toContain("More Projects");
    expect(html).toContain("Previous Project");
    expect(html).toContain("Next Project");
    expect(html).toContain("Request a Quote");
    expect(html).not.toMatch(/storageKey|privateRoot|\\private\\/i);
  });

  it("renders structured project content semantically while legacy content remains supported", () => {
    const html = renderToStaticMarkup(
      <ProjectDetail
        context={{
          ...context,
          project: {
            ...published,
            descriptionContent: [
              {
                type: "richText",
                style: "heading2",
                content: [{ type: "text", text: "The approach", marks: [] }],
              },
              {
                type: "richList",
                style: "bullet",
                items: [[{ type: "text", text: "Protected surfaces", marks: [{ type: "bold" }] }]],
              },
            ],
          },
        }}
      />,
    );
    expect(html).toContain("<h2><span>The approach</span></h2>");
    expect(html).toContain("<strong>Protected surfaces</strong>");
    expect(html).not.toContain("The project was assessed carefully");
  });

  it("omits empty Related and More headings without leaving duplicate projects", () => {
    const html = renderToStaticMarkup(
      <ProjectDetail context={{ ...context, relatedProjects: [], moreProjects: [] }} />,
    );
    expect(html).not.toContain("Related Projects");
    expect(html).not.toContain("More Projects");
    expect(
      new Set([...context.relatedProjects, ...context.moreProjects].map(({ id }) => id)).size,
    ).toBe(2);
  });

  it("canonicalizes detail metadata to Projects and uses Cover for social metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ...published,
            coverMedia: media("cover", "Dedicated social cover"),
          }),
        ),
      ),
    );
    const metadata = await projectMetadata({ params: Promise.resolve({ slug: published.slug }) });
    expect(metadata.alternates).toEqual({
      canonical: `http://localhost:3000/projects/${published.slug}`,
    });
    expect(metadata.openGraph?.url).toBe(`http://localhost:3000/projects/${published.slug}`);
    expect(JSON.stringify(metadata)).not.toContain(`/before-after/${published.slug}`);
    expect(JSON.stringify(metadata)).toContain("Dedicated social cover");
  });

  it("server-renders a Published project context page", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(context))));
    const html = renderToStaticMarkup(
      await ProjectPage({ params: Promise.resolve({ slug: published.slug }) }),
    );
    expect(html).toContain(published.title);
    expect(html).toContain(`/projects/${context.relatedProjects[0]!.slug}`);
  });

  it("permanently redirects old listing and detail aliases directly to Projects", async () => {
    await expect(LegacyListingPage({ searchParams: Promise.resolve({}) })).rejects.toMatchObject({
      digest: expect.stringContaining("/projects;308"),
    });
    await expect(
      LegacyDetailPage({ params: Promise.resolve({ slug: published.slug }) }),
    ).rejects.toMatchObject({
      digest: expect.stringContaining(`/projects/${published.slug};308`),
    });
  });

  it("includes only canonical Published Project URLs in the sitemap", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ items: [published], page: 1, pageSize: 24, total: 1 })),
        ),
    );
    const urls = (await sitemap()).map(({ url }) => url);
    expect(urls.some((url) => url.endsWith("/projects"))).toBe(true);
    expect(urls.some((url) => url.endsWith(`/projects/${published.slug}`))).toBe(true);
    expect(urls.some((url) => url.includes("/before-after"))).toBe(false);
    expect(urls.some((url) => url.includes("private-draft"))).toBe(false);
  });
});
