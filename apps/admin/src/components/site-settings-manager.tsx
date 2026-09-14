"use client";
import { useState } from "react";
import { Button } from "@ctps/ui/primitives";
import { Save } from "@ctps/ui/icons";

import type { PublicMediaItem } from "@/lib/marketing-types";
import { MarketingImageField } from "./marketing-media-picker";

export interface SiteSettings {
  businessDisplayName?: string;
  brandTagline?: string;
  primaryCtaLabel?: string;
  footerDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoMediaId?: string | null;
  defaultSocialImageId?: string | null;
  announcementEnabled?: boolean;
  announcementText?: string;
  socialProfiles?: Partial<Record<"facebook" | "instagram" | "linkedin" | "youtube" | "x", string>>;
}
export function SiteSettingsManager({
  initialSettings,
  initialMedia,
  editable,
  canReadMedia,
  canUploadMedia,
  canUpdateMedia,
}: {
  readonly initialSettings: SiteSettings;
  readonly initialMedia: readonly PublicMediaItem[];
  readonly editable: boolean;
  readonly canReadMedia: boolean;
  readonly canUploadMedia: boolean;
  readonly canUpdateMedia: boolean;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const field = (key: keyof SiteSettings, value: string | boolean | null) =>
    setSettings((current) => ({ ...current, [key]: value }));
  const socialField = (key: keyof NonNullable<SiteSettings["socialProfiles"]>, value: string) =>
    setSettings((current) => ({
      ...current,
      socialProfiles: { ...current.socialProfiles, [key]: value },
    }));
  const save = async () => {
    const response = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    const result = (await response.json()) as { message?: string };
    setMessage(response.ok ? "Site settings saved." : (result.message ?? "Save failed."));
  };
  return (
    <div className="grid max-w-4xl gap-5">
      <div className="cms-toolbar">
        <div>
          <p className="eyebrow">Website</p>
          <h2 className="mt-1 text-3xl font-semibold">Site settings</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Approved public brand and contact fields. Empty contact fields stay unpublished.
          </p>
        </div>
        {editable ? (
          <Button onClick={save}>
            <Save aria-hidden="true" className="size-4" /> Save settings
          </Button>
        ) : null}
      </div>
      {message ? (
        <p aria-live="polite" className="rounded-md border p-3 text-sm">
          {message}
        </p>
      ) : null}
      <div className="grid gap-5 rounded-xl border bg-card p-6 sm:grid-cols-2">
        <label className="cms-field">
          <span>Business display name</span>
          <input
            disabled={!editable}
            value={settings.businessDisplayName ?? "CTPS"}
            onChange={(event) => field("businessDisplayName", event.target.value)}
          />
        </label>
        <label className="cms-field">
          <span>Brand tagline</span>
          <input
            disabled={!editable}
            value={settings.brandTagline ?? ""}
            onChange={(event) => field("brandTagline", event.target.value)}
          />
        </label>
        <label className="cms-field">
          <span>Primary CTA label</span>
          <input
            disabled={!editable}
            value={settings.primaryCtaLabel ?? ""}
            onChange={(event) => field("primaryCtaLabel", event.target.value)}
          />
        </label>
        <label className="cms-field sm:col-span-2">
          <span>Footer description</span>
          <textarea
            disabled={!editable}
            rows={4}
            value={settings.footerDescription ?? ""}
            onChange={(event) => field("footerDescription", event.target.value)}
          />
        </label>
        <label className="cms-field">
          <span>Public contact email</span>
          <input
            disabled={!editable}
            type="email"
            value={settings.contactEmail ?? ""}
            onChange={(event) => field("contactEmail", event.target.value)}
          />
        </label>
        <label className="cms-field">
          <span>Public contact phone</span>
          <input
            disabled={!editable}
            value={settings.contactPhone ?? ""}
            onChange={(event) => field("contactPhone", event.target.value)}
          />
        </label>
        <label className="cms-field sm:col-span-2">
          <span>Announcement text</span>
          <input
            disabled={!editable}
            value={settings.announcementText ?? ""}
            onChange={(event) => field("announcementText", event.target.value)}
          />
        </label>
        <label className="flex min-h-11 items-center gap-3 sm:col-span-2">
          <input
            checked={settings.announcementEnabled ?? true}
            disabled={!editable}
            onChange={(event) => field("announcementEnabled", event.target.checked)}
            type="checkbox"
          />
          Show the announcement bar when text is configured
        </label>
      </div>
      <section className="grid gap-5 rounded-xl border bg-card p-6">
        <div>
          <h3 className="text-xl font-semibold">Managed brand images</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select approved Public Media. The logo appears in the Header and Footer; the social
            image is the fallback for pages without a page-specific image. A 1200 × 630 source is
            recommended for social sharing.
          </p>
        </div>
        {editable && canReadMedia ? (
          <>
            <MarketingImageField
              canUpdate={canUpdateMedia}
              canUpload={canUploadMedia}
              guidance="Use an approved transparent or brand-background logo with a clear accessible business name."
              label="Primary logo"
              maxSelections={1}
              media={initialMedia}
              onChange={(ids) => field("logoMediaId", ids[0] ?? null)}
              selectedIds={settings.logoMediaId ? [settings.logoMediaId] : []}
            />
            <MarketingImageField
              canUpdate={canUpdateMedia}
              canUpload={canUploadMedia}
              guidance="Used only when a page has no deliberate social image. Review its crop and text legibility before launch."
              label="Default social image"
              maxSelections={1}
              media={initialMedia}
              onChange={(ids) => field("defaultSocialImageId", ids[0] ?? null)}
              selectedIds={settings.defaultSocialImageId ? [settings.defaultSocialImageId] : []}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {canReadMedia
              ? "Brand-image selections are read-only."
              : "Public Media access is required to review or select brand images."}
          </p>
        )}
      </section>
      <section className="grid gap-5 rounded-xl border bg-card p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h3 className="text-xl font-semibold">Social profiles</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional verified HTTPS profiles. Empty profiles are not published.
          </p>
        </div>
        {(["facebook", "instagram", "linkedin", "youtube", "x"] as const).map((platform) => (
          <label className="cms-field" key={platform}>
            <span>
              {platform === "x" ? "X" : `${platform[0]!.toUpperCase()}${platform.slice(1)}`}
            </span>
            <input
              disabled={!editable}
              inputMode="url"
              placeholder="https://"
              value={settings.socialProfiles?.[platform] ?? ""}
              onChange={(event) => socialField(platform, event.target.value)}
            />
          </label>
        ))}
      </section>
    </div>
  );
}
