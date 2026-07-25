"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select } from "@ctps/ui/primitives";
import type { AdminIdentity } from "@/lib/admin-api";

type Rule = {
  id: string;
  ruleKey: string;
  questionKey: string;
  ruleType: string;
  conditionOperator: string;
  comparisonValue?: unknown;
  minimumAdjustmentCents: number | null;
  maximumAdjustmentCents: number | null;
  adjustmentBasisPoints: number | null;
  sortOrder: number;
  enabled: boolean;
  publicLabel: string;
};
type Configuration = {
  serviceKey: string;
  enabled: boolean;
  baseMinimumCents: number;
  baseMaximumCents: number;
  minimumChargeCents: number;
  maximumEstimatorCents: number;
  roundingIncrementCents: number;
  displayOrder: number;
  customerDisclaimer: string;
  assumptions: string[];
  exclusions: string[];
  rules: Rule[];
};
export type PricingVersionDetail = {
  id: string;
  versionCode: string;
  name: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  effectiveFrom: string | null;
  effectiveTo: string | null;
  notes: string | null;
  version: number;
  configurations: Configuration[];
};
const services = [
  "window-cleaning",
  "pressure-washing",
  "gutter-cleaning",
  "moss-removal",
  "vent-cleaning",
];
const previewAnswers: Record<string, Record<string, string | number | boolean>> = {
  "window-cleaning": {
    windowCount: 10,
    storeys: 2,
    scope: "exterior",
    screens: false,
    tracksFrames: false,
    difficultAccess: false,
    condition: "standard",
  },
  "pressure-washing": {
    surfaceType: "concrete",
    areaSqFt: 500,
    distinctAreas: 1,
    staining: "light",
    oilGrease: false,
    access: "standard",
    drainage: "standard",
  },
  "gutter-cleaning": {
    storeys: 2,
    perimeter: "medium",
    guards: false,
    downspouts: true,
    heavyDebris: false,
    detachedStructures: 0,
    access: false,
  },
  "moss-removal": {
    surfaceType: "asphalt-shingle",
    affectedArea: "medium",
    coverage: "moderate",
    storeys: 2,
    slope: "moderate",
    access: "standard",
  },
  "vent-cleaning": {
    ventType: "dryer",
    ventCount: 1,
    length: "short",
    outletAccess: "easy",
    lastCleaned: "under-year",
    concern: "routine",
  },
};
const defaultConfig = (serviceKey: string, displayOrder: number): Configuration => ({
  serviceKey,
  enabled: true,
  baseMinimumCents: 0,
  baseMaximumCents: 0,
  minimumChargeCents: 0,
  maximumEstimatorCents: 500000,
  roundingIncrementCents: 500,
  displayOrder,
  customerDisclaimer: "Preliminary estimate only. Final price follows CTPS review.",
  assumptions: ["Standard access."],
  exclusions: ["Taxes and repairs."],
  rules: [],
});
async function mutate(path: string, method: string, body?: unknown) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(result.message ?? "The change could not be saved.");
  return result;
}
export function PricingVersionCreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(form: HTMLFormElement) {
    setBusy(true);
    setError("");
    const data = new FormData(form);
    try {
      const created = (await mutate("pricing/versions", "POST", {
        versionCode: data.get("versionCode"),
        name: data.get("name"),
        notes: data.get("notes") || undefined,
        effectiveFrom: data.get("effectiveFrom")
          ? new Date(String(data.get("effectiveFrom"))).toISOString()
          : undefined,
        cloneFromVersionId: data.get("cloneFromVersionId") || undefined,
      })) as { id?: string };
      router.push(`/pricing/versions/${created.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Creation failed.");
      setBusy(false);
    }
  }
  return (
    <form
      className="mt-6 grid max-w-2xl gap-4 rounded-lg border bg-card p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget);
      }}
    >
      <label>
        <Label htmlFor="version-code">Version code</Label>
        <Input id="version-code" name="versionCode" placeholder="2026-Q3-DRAFT" required />
      </label>
      <label>
        <Label htmlFor="version-name">Name</Label>
        <Input id="version-name" name="name" required />
      </label>
      <label>
        <Label htmlFor="effective">Effective from (optional until publish)</Label>
        <Input id="effective" name="effectiveFrom" type="datetime-local" />
      </label>
      <label>
        <Label htmlFor="clone">Clone version UUID (optional)</Label>
        <Input id="clone" name="cloneFromVersionId" />
      </label>
      <label>
        <Label htmlFor="notes">Internal notes</Label>
        <textarea
          className="min-h-28 w-full rounded-md border border-input bg-background p-3"
          id="notes"
          name="notes"
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={busy} type="submit">
        {busy ? "Creating…" : "Create Draft"}
      </Button>
    </form>
  );
}

export function PricingVersionEditor({
  identity,
  version,
}: {
  identity: AdminIdentity;
  version: PricingVersionDetail;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<unknown>();
  const editable =
    version.status === "DRAFT" && identity.permissions.includes("pricingVersions.update");
  async function action(path: string, method: string, body?: unknown) {
    setError("");
    setNotice("");
    try {
      await mutate(path, method, body);
      setNotice("Saved.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The action failed.");
    }
  }
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-bold text-primary">{version.status}</p>
        <h2 className="text-2xl font-semibold">{version.name}</h2>
        <code>{version.versionCode}</code>
        <p className="mt-2 text-sm text-muted-foreground">
          Published versions are immutable. Clone one to propose new pricing.
        </p>
      </div>
      {error ? (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      ) : null}
      {notice ? <p className="rounded-md bg-primary/10 p-3 text-sm">{notice}</p> : null}
      <section className="rounded-lg border bg-card p-5">
        <h3 className="text-lg font-semibold">Version controls</h3>
        <p className="mt-2 text-sm">
          Effective from:{" "}
          {version.effectiveFrom
            ? new Date(version.effectiveFrom).toLocaleString("en-CA")
            : "Not set"}
        </p>
        {editable ? (
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void action(`pricing/versions/${version.id}`, "PUT", {
                version: version.version,
                name: data.get("name"),
                notes: data.get("notes") || null,
                effectiveFrom: data.get("effectiveFrom")
                  ? new Date(String(data.get("effectiveFrom"))).toISOString()
                  : null,
              });
            }}
          >
            <label>
              <Label>Name</Label>
              <Input defaultValue={version.name} name="name" required />
            </label>
            <label>
              <Label>Effective from</Label>
              <Input
                defaultValue={
                  version.effectiveFrom
                    ? new Date(version.effectiveFrom).toISOString().slice(0, 16)
                    : ""
                }
                name="effectiveFrom"
                required
                type="datetime-local"
              />
            </label>
            <label className="sm:col-span-2">
              <Label>Internal notes</Label>
              <textarea
                className="min-h-20 w-full rounded-md border p-3"
                defaultValue={version.notes ?? ""}
                name="notes"
              />
            </label>
            <Button className="justify-self-start" type="submit">
              Save version details
            </Button>
          </form>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          {version.status === "DRAFT" &&
          identity.permissions.includes("pricingVersions.publish") ? (
            <Button onClick={() => void action(`pricing/versions/${version.id}/publish`, "POST")}>
              Validate and publish
            </Button>
          ) : null}
          {version.status !== "ARCHIVED" &&
          identity.permissions.includes("pricingVersions.archive") ? (
            <Button
              variant="outline"
              onClick={() => void action(`pricing/versions/${version.id}/archive`, "POST")}
            >
              Archive
            </Button>
          ) : null}
          {version.status === "DRAFT" && identity.permissions.includes("pricingVersions.delete") ? (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Permanently delete this unreferenced draft?"))
                  void action(`pricing/versions/${version.id}`, "DELETE");
              }}
            >
              Delete draft
            </Button>
          ) : null}
        </div>
      </section>
      {services.map((serviceKey, index) => {
        const config =
          version.configurations.find((item) => item.serviceKey === serviceKey) ??
          defaultConfig(serviceKey, index);
        return (
          <ServiceCard
            canEdit={editable}
            config={config}
            key={serviceKey}
            onSave={(body) =>
              action(`pricing/versions/${version.id}/services/${serviceKey}`, "PUT", body)
            }
            onRule={(body) =>
              action(`pricing/versions/${version.id}/services/${serviceKey}/rules`, "POST", body)
            }
            onRuleDelete={(ruleId) =>
              action(`pricing/versions/${version.id}/rules/${ruleId}`, "DELETE")
            }
          />
        );
      })}
      <section className="rounded-lg border bg-card p-5">
        <h3 className="text-lg font-semibold">Calculation preview</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Run representative inputs against this saved version without creating a public result.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {services.map((serviceKey) => (
            <Button
              key={serviceKey}
              size="sm"
              variant="outline"
              onClick={() =>
                void mutate(`pricing/versions/${version.id}/preview`, "POST", {
                  serviceKey,
                  customerType: "RESIDENTIAL",
                  serviceAreaKey: "vancouver",
                  answers: previewAnswers[serviceKey],
                })
                  .then(setPreview)
                  .catch((reason: Error) => setError(reason.message))
              }
            >
              {serviceKey}
            </Button>
          ))}
        </div>
        {preview ? (
          <pre className="mt-4 overflow-auto rounded-md bg-surface-muted p-3 text-xs">
            {JSON.stringify(preview, null, 2)}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
function ServiceCard({
  config,
  canEdit,
  onSave,
  onRule,
  onRuleDelete,
}: {
  config: Configuration;
  canEdit: boolean;
  onSave: (body: unknown) => Promise<void>;
  onRule: (body: unknown) => Promise<void>;
  onRuleDelete: (id: string) => Promise<void>;
}) {
  return (
    <details className="rounded-lg border bg-card p-5" open>
      <summary className="cursor-pointer text-lg font-semibold">
        {config.serviceKey} · {config.enabled ? "Enabled" : "Disabled"}
      </summary>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const number = (key: string) => Number(data.get(key));
          void onSave({
            serviceKey: config.serviceKey,
            enabled: data.get("enabled") === "true",
            baseMinimumCents: number("baseMinimumCents"),
            baseMaximumCents: number("baseMaximumCents"),
            minimumChargeCents: number("minimumChargeCents"),
            maximumEstimatorCents: number("maximumEstimatorCents"),
            roundingIncrementCents: number("roundingIncrementCents"),
            displayOrder: config.displayOrder,
            customerDisclaimer: data.get("customerDisclaimer"),
            assumptions: String(data.get("assumptions"))
              .split("\n")
              .map((value) => value.trim())
              .filter(Boolean),
            exclusions: String(data.get("exclusions"))
              .split("\n")
              .map((value) => value.trim())
              .filter(Boolean),
          });
        }}
      >
        {[
          ["baseMinimumCents", "Base minimum (cents)"],
          ["baseMaximumCents", "Base maximum (cents)"],
          ["minimumChargeCents", "Minimum charge (cents)"],
          ["maximumEstimatorCents", "Maximum cap (cents)"],
          ["roundingIncrementCents", "Rounding increment (cents)"],
        ].map(([key, label]) => (
          <label key={key}>
            <Label>{label}</Label>
            <Input
              defaultValue={String(config[key as keyof Configuration])}
              disabled={!canEdit}
              min="0"
              name={key}
              required
              type="number"
            />
          </label>
        ))}
        <label>
          <Label>Availability</Label>
          <Select defaultValue={String(config.enabled)} disabled={!canEdit} name="enabled">
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </Select>
        </label>
        <label className="sm:col-span-3">
          <Label>Customer disclaimer</Label>
          <textarea
            className="min-h-20 w-full rounded-md border p-3"
            defaultValue={config.customerDisclaimer}
            disabled={!canEdit}
            name="customerDisclaimer"
          />
        </label>
        <label>
          <Label>Assumptions (one per line)</Label>
          <textarea
            className="min-h-24 w-full rounded-md border p-3"
            defaultValue={config.assumptions.join("\n")}
            disabled={!canEdit}
            name="assumptions"
          />
        </label>
        <label>
          <Label>Exclusions (one per line)</Label>
          <textarea
            className="min-h-24 w-full rounded-md border p-3"
            defaultValue={config.exclusions.join("\n")}
            disabled={!canEdit}
            name="exclusions"
          />
        </label>
        {canEdit ? (
          <Button className="self-end" type="submit">
            Save service
          </Button>
        ) : null}
      </form>
      <h4 className="mt-7 font-semibold">Ordered rules</h4>
      <ul className="mt-3 grid gap-2">
        {config.rules.map((rule) => (
          <li
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm"
            key={rule.id}
          >
            <span>
              <strong>{rule.publicLabel}</strong>
              <br />
              <code>{rule.ruleKey}</code> · {rule.ruleType} · {rule.questionKey}{" "}
              {rule.conditionOperator} {JSON.stringify(rule.comparisonValue)}
            </span>
            {canEdit ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => void onRuleDelete(rule.id)}
                type="button"
              >
                Delete
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {canEdit ? (
        <form
          className="mt-5 grid gap-3 rounded-md bg-surface-muted p-4 sm:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const value = String(data.get("comparisonValue"));
            void onRule({
              ruleKey: data.get("ruleKey"),
              questionKey: data.get("questionKey"),
              ruleType: data.get("ruleType"),
              conditionOperator: data.get("conditionOperator"),
              comparisonValue:
                value === "true"
                  ? true
                  : value === "false"
                    ? false
                    : /^\d+$/.test(value)
                      ? Number(value)
                      : value,
              minimumAdjustmentCents: Number(data.get("minimumAdjustmentCents") || 0),
              maximumAdjustmentCents: Number(data.get("maximumAdjustmentCents") || 0),
              sortOrder: Number(data.get("sortOrder") || 0),
              enabled: true,
              publicLabel: data.get("publicLabel"),
            });
          }}
        >
          <Input name="ruleKey" placeholder="Rule key" required />
          <Input name="questionKey" placeholder="Question key" required />
          <Select name="ruleType">
            <option>FIXED_RANGE_ADDITION</option>
            <option>FIXED_RANGE_REPLACEMENT</option>
            <option>PER_UNIT_RANGE</option>
            <option>PERCENTAGE_RANGE_ADJUSTMENT</option>
            <option>TIER_RANGE</option>
            <option>MINIMUM_CHARGE</option>
            <option>SERVICE_AREA_RANGE_ADDITION</option>
            <option>CUSTOMER_TYPE_RANGE_ADDITION</option>
            <option>MANUAL_REVIEW</option>
          </Select>
          <Select name="conditionOperator">
            <option>EQUALS</option>
            <option>NOT_EQUALS</option>
            <option>GREATER_THAN</option>
            <option>GREATER_THAN_OR_EQUAL</option>
            <option>LESS_THAN</option>
            <option>LESS_THAN_OR_EQUAL</option>
            <option>BOOLEAN_TRUE</option>
            <option>BOOLEAN_FALSE</option>
          </Select>
          <Input name="comparisonValue" placeholder="Comparison value" />
          <Input name="minimumAdjustmentCents" placeholder="Min adjustment cents" type="number" />
          <Input name="maximumAdjustmentCents" placeholder="Max adjustment cents" type="number" />
          <Input name="sortOrder" placeholder="Order" required type="number" />
          <Input name="publicLabel" placeholder="Public explanation label" required />
          <Button type="submit">Add or replace rule</Button>
        </form>
      ) : null}
    </details>
  );
}
export function EstimatorResultArchive({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <div>
      <Button
        variant="outline"
        onClick={() =>
          void mutate(`estimator-results/${id}/archive`, "POST")
            .then(() => router.push("/estimator-results"))
            .catch((reason: Error) => setError(reason.message))
        }
      >
        Archive result
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
