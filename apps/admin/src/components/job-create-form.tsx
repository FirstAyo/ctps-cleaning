"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const services = [
  "window-cleaning",
  "pressure-washing",
  "gutter-cleaning",
  "moss-removal",
  "vent-cleaning",
];
const areas = ["vancouver", "richmond", "burnaby", "surrey", "coquitlam", "north-vancouver"];
async function mutate(path: string, body: unknown) {
  const response = await fetch(`/api/admin/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!response.ok) throw new Error(result.message ?? "The job could not be created.");
  return result;
}
export function JobCreateForm({
  eligibleQuotes,
  canCreateInternal,
  defaultQuoteId,
}: {
  eligibleQuotes: readonly {
    id: string;
    reference: string;
    customerName: string;
    status: string;
  }[];
  canCreateInternal: boolean;
  defaultQuoteId?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState(eligibleQuotes.length ? "quote" : "internal");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const result =
        mode === "quote"
          ? await mutate(`jobs/from-quote/${String(data.get("quoteRequestId"))}`, {
              confirmExternalAcceptance: data.get("confirmExternalAcceptance") === "on",
              serviceScopeSummary: data.get("serviceScopeSummary"),
            })
          : await mutate("jobs", {
              customerType: data.get("customerType"),
              customerName: data.get("customerName"),
              customerEmail: data.get("customerEmail"),
              customerPhone: data.get("customerPhone"),
              companyName: data.get("companyName") || null,
              propertyAddressLine1: data.get("address1"),
              propertyAddressLine2: data.get("address2") || null,
              city:
                areas.find((area) => area === data.get("serviceAreaKey")) === "north-vancouver"
                  ? "North Vancouver"
                  : String(data.get("serviceAreaKey")).replace(
                      /(^|-)([a-z])/g,
                      (_, dash: string, letter: string) =>
                        `${dash ? " " : ""}${letter.toUpperCase()}`,
                    ),
              serviceAreaKey: data.get("serviceAreaKey"),
              province: "British Columbia",
              postalCode: data.get("postalCode"),
              propertyType: data.get("propertyType"),
              services: [
                {
                  serviceKey: data.get("serviceKey"),
                  scopeSummary: data.get("serviceScopeSummary"),
                },
              ],
              serviceScopeSummary: data.get("serviceScopeSummary"),
              accessNotes: data.get("accessNotes") || null,
              customerSchedulingNotes: data.get("customerSchedulingNotes") || null,
              internalOperationalNotes: data.get("internalOperationalNotes") || null,
            });
      if (result.id) router.push(`/jobs/${result.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The job could not be created.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="grid gap-5" onSubmit={submit}>
      <fieldset className="grid gap-3 rounded-lg border border-border bg-card p-5">
        <legend className="px-2 font-semibold">Creation source</legend>
        {eligibleQuotes.length ? (
          <label className="flex gap-2">
            <input checked={mode === "quote"} onChange={() => setMode("quote")} type="radio" />{" "}
            Eligible quote request
          </label>
        ) : null}
        {canCreateInternal ? (
          <label className="flex gap-2">
            <input
              checked={mode === "internal"}
              onChange={() => setMode("internal")}
              type="radio"
            />{" "}
            Staff-created job
          </label>
        ) : null}
      </fieldset>
      {mode === "quote" ? (
        <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
          <label className="grid gap-1 font-semibold">
            Eligible quote
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3"
              defaultValue={defaultQuoteId}
              name="quoteRequestId"
              required
            >
              {eligibleQuotes.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {quote.reference} — {quote.customerName} ({quote.status})
                </option>
              ))}
            </select>
          </label>
          <label className="flex gap-2 text-sm">
            <input name="confirmExternalAcceptance" type="checkbox" /> Confirm external acceptance
            when the quote is not already Accepted
          </label>
        </section>
      ) : (
        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
          <label className="grid gap-1 font-semibold">
            Customer name
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3"
              name="customerName"
              required
            />
          </label>
          <label className="grid gap-1 font-semibold">
            Email
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3"
              name="customerEmail"
              required
              type="email"
            />
          </label>
          <label className="grid gap-1 font-semibold">
            Phone
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3"
              name="customerPhone"
              required
            />
          </label>
          <label className="grid gap-1 font-semibold">
            Company
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3"
              name="companyName"
            />
          </label>
          <label className="grid gap-1 font-semibold">
            Customer type
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3"
              name="customerType"
            >
              <option>RESIDENTIAL</option>
              <option>COMMERCIAL</option>
            </select>
          </label>
          <label className="grid gap-1 font-semibold">
            Property type
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3"
              defaultValue="Residential property"
              name="propertyType"
              required
            />
          </label>
          <label className="grid gap-1 font-semibold sm:col-span-2">
            Address
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3"
              name="address1"
              required
            />
          </label>
          <label className="grid gap-1 font-semibold">
            Address line 2
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3"
              name="address2"
            />
          </label>
          <label className="grid gap-1 font-semibold">
            Postal code
            <input
              className="min-h-11 rounded-md border border-input bg-background px-3"
              name="postalCode"
              required
            />
          </label>
          <label className="grid gap-1 font-semibold">
            Service area
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3"
              name="serviceAreaKey"
            >
              {areas.map((area) => (
                <option key={area}>{area}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 font-semibold">
            Service
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3"
              name="serviceKey"
            >
              {services.map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 font-semibold sm:col-span-2">
            Access notes
            <textarea
              className="min-h-24 rounded-md border border-input bg-background p-3"
              name="accessNotes"
            />
          </label>
          <label className="grid gap-1 font-semibold sm:col-span-2">
            Customer scheduling notes
            <textarea
              className="min-h-24 rounded-md border border-input bg-background p-3"
              name="customerSchedulingNotes"
            />
          </label>
          <label className="grid gap-1 font-semibold sm:col-span-2">
            Private operational notes
            <textarea
              className="min-h-24 rounded-md border border-input bg-background p-3"
              name="internalOperationalNotes"
            />
          </label>
        </section>
      )}
      <label className="grid gap-1 rounded-lg border border-border bg-card p-5 font-semibold">
        Confirmed service scope
        <textarea
          className="mt-1 min-h-32 rounded-md border border-input bg-background p-3"
          maxLength={4000}
          name="serviceScopeSummary"
          required
        />
      </label>
      {message ? (
        <p aria-live="assertive" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <div className="flex gap-3">
        <button
          className="min-h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground"
          disabled={busy}
          type="submit"
        >
          {busy ? "Creating…" : "Save Draft job"}
        </button>
        <button
          className="min-h-11 rounded-md border border-border px-5"
          onClick={() => history.back()}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
