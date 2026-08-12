"use client";
import { useState } from "react";
import { Button } from "@ctps/ui/primitives";
import { Save } from "@ctps/ui/icons";

interface Settings {
  brandTagline?: string;
  primaryCtaLabel?: string;
  footerDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
}
export function SiteSettingsManager({
  initialSettings,
  editable,
}: {
  readonly initialSettings: Settings;
  readonly editable: boolean;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const field = (key: keyof Settings, value: string) =>
    setSettings((current) => ({ ...current, [key]: value }));
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
      </div>
    </div>
  );
}
