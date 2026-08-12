"use client";

import { useState } from "react";
import { Button } from "@ctps/ui/primitives";
import { ChevronLeft, ChevronRight, Save, Upload } from "@ctps/ui/icons";
import Link from "next/link";

import type {
  MarketingPage,
  MarketingProjectOption,
  MarketingSection,
  PublicMediaItem,
} from "@/lib/marketing-types";
import { MarketingImageField } from "./marketing-media-picker";

async function mutation(path: string, method: "PATCH" | "POST", body: unknown) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(result.message ?? "The change could not be saved.");
  return result;
}

export function MarketingPageEditor({
  page: initialPage,
  media,
  projects = [],
  canPublish,
  canSeo,
  canMediaUpload,
  canMediaUpdate,
}: {
  readonly page: MarketingPage;
  readonly media: readonly PublicMediaItem[];
  readonly projects?: readonly MarketingProjectOption[];
  readonly canPublish: boolean;
  readonly canSeo: boolean;
  readonly canMediaUpload: boolean;
  readonly canMediaUpdate: boolean;
}) {
  const [page, setPage] = useState(initialPage);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const updateSection = (index: number, update: Partial<MarketingSection>) =>
    setPage((current) => ({
      ...current,
      draftContent: {
        sections: current.draftContent.sections.map((section, itemIndex) =>
          itemIndex === index ? { ...section, ...update } : section,
        ),
      },
    }));
  const move = (index: number, direction: -1 | 1) =>
    setPage((current) => {
      const sections = [...current.draftContent.sections];
      const target = index + direction;
      if (target < 0 || target >= sections.length) return current;
      [sections[index], sections[target]] = [sections[target]!, sections[index]!];
      return { ...current, draftContent: { sections } };
    });
  const updateItem = (sectionIndex: number, itemIndex: number, update: Record<string, string>) => {
    const section = page.draftContent.sections[sectionIndex]!;
    updateSection(sectionIndex, {
      items: (section.items ?? []).map((item, index) =>
        index === itemIndex ? { ...item, ...update } : item,
      ),
    });
  };
  const save = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = (await mutation(`pages/${page.pageKey}`, "PATCH", {
        version: page.version,
        title: page.title,
        navigationLabel: page.navigationLabel ?? undefined,
        draftContent: page.draftContent,
        ...(canSeo
          ? {
              seoTitle: page.seoTitle ?? undefined,
              seoDescription: page.seoDescription ?? undefined,
              ogTitle: page.ogTitle ?? undefined,
              ogDescription: page.ogDescription ?? undefined,
              socialImageId: page.socialImageId ?? undefined,
            }
          : {}),
      })) as MarketingPage;
      setPage((current) => ({ ...current, ...result }));
      setMessage("Draft saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = (await mutation(`pages/${page.pageKey}/publish`, "POST", {
        version: page.version,
      })) as MarketingPage;
      setPage((current) => ({ ...current, ...result }));
      setMessage("Published successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publish failed.");
    } finally {
      setBusy(false);
    }
  };
  const restore = async (revisionId: string) => {
    if (
      !window.confirm(
        "Restore this revision into the current Draft? Published content will not change.",
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      const result = (await mutation(
        `pages/${page.pageKey}/revisions/${revisionId}/restore`,
        "POST",
        { version: page.version },
      )) as MarketingPage;
      setPage((current) => ({ ...current, ...result }));
      setMessage("Revision restored into Draft.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Restore failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="cms-editor-grid">
      <div className="grid gap-5">
        <div className="cms-toolbar">
          <div>
            <p className="eyebrow">
              {page.pageType} · {page.status}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{page.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold"
              href={`/pages/${page.pageKey}/preview`}
              target="_blank"
            >
              Preview
            </Link>
            <Button disabled={busy} onClick={save}>
              <Save aria-hidden="true" className="size-4" /> Save draft
            </Button>
            {canPublish ? (
              <Button disabled={busy} onClick={publish} variant="secondary">
                <Upload aria-hidden="true" className="size-4" /> Publish
              </Button>
            ) : null}
          </div>
        </div>
        {message ? (
          <p aria-live="polite" className="rounded-md border border-border bg-card p-3 text-sm">
            {message}
          </p>
        ) : null}
        {page.draftContent.sections.map((section, index) => (
          <article className="cms-section-card" key={section.id}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {section.type.replaceAll("_", " ")}
                </p>
                <p className="text-sm text-muted-foreground">Section {index + 1}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  aria-label="Move section up"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  size="icon"
                  variant="outline"
                >
                  <ChevronLeft aria-hidden="true" className="size-4 rotate-90" />
                </Button>
                <Button
                  aria-label="Move section down"
                  disabled={index === page.draftContent.sections.length - 1}
                  onClick={() => move(index, 1)}
                  size="icon"
                  variant="outline"
                >
                  <ChevronRight aria-hidden="true" className="size-4 rotate-90" />
                </Button>
              </div>
            </header>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <label className="cms-field">
                <span>Eyebrow</span>
                <input
                  value={section.eyebrow ?? ""}
                  onChange={(event) => updateSection(index, { eyebrow: event.target.value })}
                />
              </label>
              <label className="cms-field">
                <span>Heading</span>
                <input
                  required
                  value={section.title}
                  onChange={(event) => updateSection(index, { title: event.target.value })}
                />
              </label>
              <label className="cms-field sm:col-span-2">
                <span>Supporting copy</span>
                <textarea
                  rows={3}
                  value={section.body ?? ""}
                  onChange={(event) => updateSection(index, { body: event.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  checked={section.enabled}
                  onChange={(event) => updateSection(index, { enabled: event.target.checked })}
                  type="checkbox"
                />{" "}
                Show this section
              </label>
              {section.type === "HERO_SLIDER" ? (
                <>
                  <label className="cms-field">
                    <span>Primary CTA label</span>
                    <input
                      value={section.primaryCta?.label ?? ""}
                      onChange={(event) =>
                        updateSection(index, {
                          primaryCta: {
                            label: event.target.value,
                            href: section.primaryCta?.href ?? "/request-a-quote",
                          },
                        })
                      }
                    />
                  </label>
                  <label className="cms-field">
                    <span>Primary CTA destination</span>
                    <input
                      value={section.primaryCta?.href ?? ""}
                      onChange={(event) =>
                        updateSection(index, {
                          primaryCta: {
                            label: section.primaryCta?.label ?? "Request a Quote",
                            href: event.target.value,
                          },
                        })
                      }
                    />
                  </label>
                  <label className="cms-field">
                    <span>Secondary CTA label</span>
                    <input
                      value={section.secondaryCta?.label ?? ""}
                      onChange={(event) =>
                        updateSection(index, {
                          secondaryCta: {
                            label: event.target.value,
                            href: section.secondaryCta?.href ?? "/estimate",
                          },
                        })
                      }
                    />
                  </label>
                  <label className="cms-field">
                    <span>Secondary CTA destination</span>
                    <input
                      value={section.secondaryCta?.href ?? ""}
                      onChange={(event) =>
                        updateSection(index, {
                          secondaryCta: {
                            label: section.secondaryCta?.label ?? "Learn more",
                            href: event.target.value,
                          },
                        })
                      }
                    />
                  </label>
                  <label className="cms-field">
                    <span>Overlay</span>
                    <select
                      value={section.overlay}
                      onChange={(event) =>
                        updateSection(index, {
                          overlay: event.target.value as "SOFT" | "BALANCED" | "STRONG",
                        })
                      }
                    >
                      <option>SOFT</option>
                      <option>BALANCED</option>
                      <option>STRONG</option>
                    </select>
                  </label>
                  <label className="cms-field">
                    <span>Slide interval</span>
                    <select
                      value={section.intervalMs}
                      onChange={(event) =>
                        updateSection(index, {
                          intervalMs: Number(event.target.value) as 6000 | 7000 | 8000 | 10000,
                        })
                      }
                    >
                      <option value="6000">6 seconds</option>
                      <option value="7000">7 seconds</option>
                      <option value="8000">8 seconds</option>
                      <option value="10000">10 seconds</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      checked={section.autoplay ?? false}
                      onChange={(event) => updateSection(index, { autoplay: event.target.checked })}
                      type="checkbox"
                    />{" "}
                    Auto-advance slides
                  </label>
                  <MarketingImageField
                    canUpdate={canMediaUpdate}
                    canUpload={canMediaUpload}
                    guidance="Select and reorder up to four optimized public images. Only the first slide is prioritized publicly."
                    label="Hero images"
                    maxSelections={4}
                    media={media}
                    onChange={(mediaIds) => updateSection(index, { mediaIds })}
                    selectedIds={section.mediaIds}
                  />
                </>
              ) : null}
              {page.pageKey === "HOME" && section.type === "SERVICE_SHOWCASE" ? (
                <MarketingImageField
                  canUpdate={canMediaUpdate}
                  canUpload={canMediaUpload}
                  guidance="Images follow the service order shown below. Reuse one library image where appropriate without uploading another copy."
                  label="Service showcase images"
                  maxSelections={section.items?.length ?? 5}
                  media={media}
                  onChange={(mediaIds) => updateSection(index, { mediaIds })}
                  selectedIds={section.mediaIds}
                  {...(section.items
                    ? { slotLabels: section.items.map(({ title }) => title) }
                    : {})}
                />
              ) : null}
              {page.pageKey === "HOME" && section.type === "RESIDENTIAL_COMMERCIAL" ? (
                <MarketingImageField
                  canUpdate={canMediaUpdate}
                  canUpload={canMediaUpload}
                  guidance="The first image is Residential and the second is Commercial."
                  label="Property-type images"
                  maxSelections={2}
                  media={media}
                  onChange={(mediaIds) => updateSection(index, { mediaIds })}
                  selectedIds={section.mediaIds}
                  slotLabels={["Residential", "Commercial"]}
                />
              ) : null}
              {page.pageKey === "HOME" && section.type === "FINAL_CTA" ? (
                <MarketingImageField
                  canUpdate={canMediaUpdate}
                  canUpload={canMediaUpload}
                  guidance="Choose the single background image used beneath the controlled CTA overlay."
                  label="Final CTA background"
                  maxSelections={1}
                  media={media}
                  onChange={(mediaIds) => updateSection(index, { mediaIds })}
                  selectedIds={section.mediaIds}
                />
              ) : null}
              {page.pageKey !== "HOME" &&
              [
                "SERVICE_SHOWCASE",
                "MEDIA_TEXT",
                "CONTACT",
                "RELATED_SERVICES",
                "FINAL_CTA",
              ].includes(section.type) ? (
                <MarketingImageField
                  canUpdate={canMediaUpdate}
                  canUpload={canMediaUpload}
                  guidance={
                    section.type === "SERVICE_SHOWCASE"
                      ? "Images follow the service order. Use approved property-care photography."
                      : "Choose approved marketing photography for this section. Focal-point changes are managed in Public Media."
                  }
                  label={`${section.title} images`}
                  maxSelections={
                    section.type === "SERVICE_SHOWCASE" || section.type === "RELATED_SERVICES"
                      ? Math.max(1, section.items?.length ?? 1)
                      : 1
                  }
                  media={media}
                  onChange={(mediaIds) => updateSection(index, { mediaIds })}
                  selectedIds={section.mediaIds}
                  {...(section.items?.length
                    ? { slotLabels: section.items.map(({ title }) => title) }
                    : {})}
                />
              ) : null}
              {section.items?.length ? (
                <fieldset className="cms-item-editor sm:col-span-2">
                  <legend>Section entries</legend>
                  {section.items.map((item, itemIndex) => (
                    <div className="cms-item-editor-row" key={item.key}>
                      <label className="cms-field">
                        <span>Title</span>
                        <input
                          value={item.title}
                          onChange={(event) =>
                            updateItem(index, itemIndex, { title: event.target.value })
                          }
                        />
                      </label>
                      <label className="cms-field">
                        <span>Description</span>
                        <textarea
                          rows={2}
                          value={item.body ?? ""}
                          onChange={(event) =>
                            updateItem(index, itemIndex, { body: event.target.value })
                          }
                        />
                      </label>
                      {item.href ? (
                        <label className="cms-field">
                          <span>Destination</span>
                          <input
                            value={item.href}
                            onChange={(event) =>
                              updateItem(index, itemIndex, { href: event.target.value })
                            }
                          />
                        </label>
                      ) : null}
                      {["SERVICE_SHOWCASE", "RELATED_SERVICES"].includes(section.type) ? (
                        <label className="cms-field">
                          <span>Contextual image alt text</span>
                          <input
                            value={item.altText ?? ""}
                            onChange={(event) =>
                              updateItem(index, itemIndex, { altText: event.target.value })
                            }
                          />
                        </label>
                      ) : null}
                    </div>
                  ))}
                </fieldset>
              ) : null}
              {["FEATURED_PROJECT", "PROJECT_GRID"].includes(section.type) && projects.length ? (
                <fieldset className="cms-project-selector sm:col-span-2">
                  <legend>Published Before & After proof</legend>
                  <p>
                    Select only approved Published projects. Their images stay in the canonical
                    Before & After system.
                  </p>
                  {projects.map((project) => {
                    const checked = section.projectIds?.includes(project.id) ?? false;
                    return (
                      <label key={project.id}>
                        <input
                          checked={checked}
                          type={section.type === "FEATURED_PROJECT" ? "radio" : "checkbox"}
                          name={`${section.id}-project`}
                          onChange={(event) =>
                            updateSection(index, {
                              projectIds: event.target.checked
                                ? section.type === "FEATURED_PROJECT"
                                  ? [project.id]
                                  : [...(section.projectIds ?? []), project.id].slice(0, 6)
                                : (section.projectIds ?? []).filter((id) => id !== project.id),
                            })
                          }
                        />{" "}
                        <span>{project.title}</span>
                      </label>
                    );
                  })}
                </fieldset>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <aside className="cms-seo-panel">
        <p className="eyebrow">Page settings</p>
        <label className="cms-field mt-4">
          <span>Page title</span>
          <input
            value={page.title}
            onChange={(event) => setPage((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
        <label className="cms-field mt-4">
          <span>Navigation label</span>
          <input
            value={page.navigationLabel ?? ""}
            onChange={(event) =>
              setPage((current) => ({ ...current, navigationLabel: event.target.value || null }))
            }
          />
        </label>
        <p className="mt-5 text-xs text-muted-foreground">
          Fixed key: {page.pageKey}
          <br />
          Fixed route: {page.slug}
          <br />
          Version {page.version}
        </p>
        {canSeo ? (
          <div className="mt-7 border-t border-border pt-6">
            <p className="eyebrow">Search & sharing</p>
            <label className="cms-field mt-4">
              <span>SEO title</span>
              <input
                maxLength={70}
                value={page.seoTitle ?? ""}
                onChange={(event) =>
                  setPage((current) => ({ ...current, seoTitle: event.target.value || null }))
                }
              />
            </label>
            <label className="cms-field mt-4">
              <span>SEO description</span>
              <textarea
                maxLength={180}
                rows={4}
                value={page.seoDescription ?? ""}
                onChange={(event) =>
                  setPage((current) => ({ ...current, seoDescription: event.target.value || null }))
                }
              />
            </label>
          </div>
        ) : null}
        {page.revisions.length ? (
          <div className="mt-7 border-t border-border pt-6">
            <p className="eyebrow">Recent revisions</p>
            <ul className="mt-3 grid gap-2">
              {page.revisions.map((revision) => (
                <li className="flex items-center justify-between gap-2 text-xs" key={revision.id}>
                  <span>
                    v{revision.revisionNumber}
                    <br />
                    {revision.createdBy.displayName}
                  </span>
                  {canPublish ? (
                    <Button
                      disabled={busy}
                      onClick={() => restore(revision.id)}
                      size="sm"
                      variant="outline"
                    >
                      Restore
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
