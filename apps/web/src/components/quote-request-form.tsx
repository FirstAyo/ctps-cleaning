"use client";
/* eslint-disable @next/next/no-img-element -- local object URLs preview private images before upload */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  key: string;
  label: string;
  type: "number" | "boolean" | "text" | "select";
  required: boolean;
  options?: readonly string[];
};
type Service = { key: string; label: string; questions: readonly Question[] };
type Area = { key: string; label: string };
type Upload = {
  id: string;
  filename: string;
  url: string;
  sortOrder: number;
  state: "ready" | "uploading" | "error";
  file?: File;
};
const titles = [
  "Property",
  "Services",
  "Service details",
  "Address",
  "Preferred dates",
  "Photos",
  "Contact",
  "Review",
];

async function jsonRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`/api/quote/${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { "content-type": "application/json" }),
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok)
    throw new Error(
      typeof body.message === "string" ? body.message : "The request could not be completed.",
    );
  return body;
}

export function QuoteRequestForm({
  estimateTransferToken = "",
}: {
  estimateTransferToken?: string;
}) {
  const router = useRouter();
  const [transferToken] = useState(
    () =>
      estimateTransferToken ||
      (typeof window === "undefined"
        ? ""
        : new URLSearchParams(window.location.search).get("estimate") || ""),
  );
  const [estimateNotice, setEstimateNotice] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(0);
  const [draftToken, setDraftToken] = useState("");
  const [services, setServices] = useState<readonly Service[]>([]);
  const [areas, setAreas] = useState<readonly Area[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, Record<string, string | number | boolean>>>(
    {},
  );
  const [propertyType, setPropertyType] = useState<"RESIDENTIAL" | "COMMERCIAL">("RESIDENTIAL");
  const [accessNotes, setAccessNotes] = useState("");
  const [approximateSize, setApproximateSize] = useState("");
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    province: "British Columbia",
    postalCode: "",
    serviceAreaKey: "",
  });
  const [dates, setDates] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [contact, setContact] = useState({
    fullName: "",
    email: "",
    phone: "",
    preferredMethod: "EMAIL",
    companyName: "",
  });
  const [consent, setConsent] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const restore = setTimeout(() => {
      const saved = sessionStorage.getItem("ctps_quote_nonsensitive");
      if (saved) {
        try {
          const value = JSON.parse(saved) as {
            step?: number;
            selected?: string[];
            propertyType?: "RESIDENTIAL" | "COMMERCIAL";
          };
          setStep(Math.min(value.step ?? 0, 7));
          setSelected(value.selected ?? []);
          setPropertyType(value.propertyType ?? "RESIDENTIAL");
        } catch {
          sessionStorage.removeItem("ctps_quote_nonsensitive");
        }
      }
    }, 0);
    void jsonRequest("drafts", { method: "POST", body: JSON.stringify({ honeypot: "" }) })
      .then((body) => {
        setDraftToken(String(body.draftToken));
        setServices(body.services as unknown as Service[]);
        setAreas(body.serviceAreas as unknown as Area[]);
      })
      .catch((cause: Error) => setError(cause.message));
    return () => clearTimeout(restore);
  }, []);
  useEffect(() => {
    if (!transferToken) return;
    void fetch(`/api/estimator/quote-transfer/${encodeURIComponent(transferToken)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const body = (await response.json()) as {
          message?: string;
          serviceKey?: string;
          propertyType?: "RESIDENTIAL" | "COMMERCIAL";
          serviceAreaKey?: string;
          serviceAnswers?: Record<string, string | number | boolean>;
        };
        if (!response.ok || !body.serviceKey)
          throw new Error(body.message ?? "Estimate transfer unavailable.");
        setSelected([body.serviceKey]);
        setPropertyType(body.propertyType ?? "RESIDENTIAL");
        setAddress((current) => ({
          ...current,
          serviceAreaKey: body.serviceAreaKey ?? "",
          city:
            body.serviceAreaKey
              ?.split("-")
              .map((word) => word[0]?.toUpperCase() + word.slice(1))
              .join(" ") ?? "",
        }));
        setAnswers({ [body.serviceKey]: body.serviceAnswers ?? {} });
        setEstimateNotice(
          "Your preliminary estimate details were securely prefilled. You may change them; CTPS will record whether the submitted scope still matches.",
        );
      })
      .catch((cause: Error) => setEstimateNotice(cause.message));
  }, [transferToken]);
  useEffect(() => {
    sessionStorage.setItem(
      "ctps_quote_nonsensitive",
      JSON.stringify({ step, selected, propertyType }),
    );
  }, [step, selected, propertyType]);
  const chosen = useMemo(
    () => services.filter(({ key }) => selected.includes(key)),
    [services, selected],
  );
  function next() {
    setError("");
    if (step === 1 && !selected.length) {
      setError("Choose at least one service.");
      return;
    }
    if (
      step === 2 &&
      chosen.some((service) =>
        service.questions.some(
          (question) =>
            question.required &&
            (answers[service.key]?.[question.key] === undefined ||
              answers[service.key]?.[question.key] === ""),
        ),
      )
    ) {
      setError("Complete each required service question before continuing.");
      return;
    }
    if (
      step === 3 &&
      (!address.line1 ||
        !address.serviceAreaKey ||
        !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(address.postalCode))
    ) {
      setError("Enter the street address, approved service area, and a valid postal code.");
      return;
    }
    if (
      step === 6 &&
      (!contact.fullName ||
        !/^\S+@\S+\.\S+$/.test(contact.email) ||
        !/^[+()\- .0-9]{7,32}$/.test(contact.phone))
    ) {
      setError("Enter your full name, a valid email address, and a valid phone number.");
      return;
    }
    setStep((value) => Math.min(7, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function addFiles(files: FileList | readonly File[] | null) {
    if (!files?.length || !draftToken) return;
    setBusy(true);
    setError("");
    for (const [index, file] of [...files].entries()) {
      const pending: Upload = {
        id: `pending-${Date.now()}-${index}`,
        filename: file.name,
        url: URL.createObjectURL(file),
        sortOrder: uploads.length + index,
        state: "uploading",
        file,
      };
      setUploads((current) => [...current, pending]);
      const form = new FormData();
      form.append("files", file);
      try {
        const body = await jsonRequest("uploads", {
          method: "POST",
          body: form,
          headers: { "x-quote-draft-token": draftToken },
        });
        const created = (
          body.uploads as unknown as { id: string; filename: string; sortOrder: number }[]
        )[0]!;
        setUploads((current) =>
          current.map((item) =>
            item.id === pending.id ? { ...created, url: pending.url, state: "ready" } : item,
          ),
        );
      } catch (cause) {
        setUploads((current) =>
          current.map((item) => (item.id === pending.id ? { ...item, state: "error" } : item)),
        );
        setError(cause instanceof Error ? cause.message : "One or more uploads failed.");
      }
    }
    setBusy(false);
  }
  async function remove(upload: Upload) {
    if (upload.state === "ready")
      await jsonRequest(`uploads/${upload.id}`, {
        method: "DELETE",
        headers: { "x-quote-draft-token": draftToken },
      });
    URL.revokeObjectURL(upload.url);
    setUploads((current) => current.filter(({ id }) => id !== upload.id));
  }
  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= uploads.length) return;
    const ordered = [...uploads];
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    setUploads(ordered);
    const ids = ordered.filter(({ state }) => state === "ready").map(({ id }) => id);
    await jsonRequest("uploads/order", {
      method: "PUT",
      headers: { "x-quote-draft-token": draftToken },
      body: JSON.stringify({ uploadIds: ids }),
    }).catch((cause: Error) => setError(cause.message));
  }
  async function submit() {
    if (!consent) {
      setError("Accept the privacy and contact consent to submit.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = await jsonRequest("submit", {
        method: "POST",
        body: JSON.stringify({
          draftToken,
          idempotencyKey,
          ...(transferToken ? { estimateTransferToken: transferToken } : {}),
          honeypot: "",
          propertyType,
          services: selected,
          serviceAnswers: answers,
          propertyDetails: { accessNotes, approximateSize },
          address,
          preferredDates: dates.filter(Boolean),
          notes,
          contact,
          consent,
        }),
      });
      sessionStorage.removeItem("ctps_quote_nonsensitive");
      router.push(
        body.alreadySubmitted
          ? "/request-a-quote/confirmation?duplicate=1"
          : `/request-a-quote/confirmation?token=${encodeURIComponent(String(body.confirmationToken ?? ""))}`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
      {estimateNotice ? (
        <p className="mb-5 rounded-md border border-primary/25 bg-primary/5 p-3 text-sm">
          {estimateNotice}
        </p>
      ) : null}
      <div aria-label="Quote request progress" className="mb-8">
        <p className="text-sm font-semibold text-primary">
          Step {step + 1} of {titles.length}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((step + 1) / titles.length) * 100}%` }}
          />
        </div>
        <ol className="mt-3 hidden grid-cols-4 gap-2 text-xs text-muted-foreground sm:grid lg:grid-cols-8">
          {titles.map((title, index) => (
            <li
              aria-current={index === step ? "step" : undefined}
              className={index === step ? "font-bold text-foreground" : ""}
              key={title}
            >
              {title}
            </li>
          ))}
        </ol>
      </div>
      <div aria-live="polite">
        {error ? (
          <p
            className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
      <fieldset className="grid gap-5" disabled={busy}>
        <legend className="mb-5 text-2xl font-bold">{titles[step]}</legend>
        {step === 0 ? (
          <>
            <label className="grid gap-2 font-semibold">
              Property type
              <select
                className="min-h-11 rounded-md border border-input bg-background px-3"
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value as typeof propertyType)}
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </label>
            <label className="grid gap-2 font-semibold">
              Approximate property size{" "}
              <span className="text-sm font-normal text-muted-foreground">Optional</span>
              <input
                className="min-h-11 rounded-md border border-input bg-background px-3"
                maxLength={100}
                value={approximateSize}
                onChange={(event) => setApproximateSize(event.target.value)}
                placeholder="For example, 2,000 sq. ft."
              />
            </label>
            <label className="grid gap-2 font-semibold">
              Access or property notes{" "}
              <span className="text-sm font-normal text-muted-foreground">Optional</span>
              <textarea
                className="min-h-28 rounded-md border border-input bg-background p-3"
                maxLength={1000}
                value={accessNotes}
                onChange={(event) => setAccessNotes(event.target.value)}
              />
            </label>
          </>
        ) : null}
        {step === 1 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <label
                className="flex min-h-14 items-center gap-3 rounded-md border border-border p-4 font-semibold"
                key={service.key}
              >
                <input
                  checked={selected.includes(service.key)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, service.key]
                        : current.filter((key) => key !== service.key),
                    )
                  }
                  type="checkbox"
                />
                {service.label}
              </label>
            ))}
          </div>
        ) : null}
        {step === 2 ? (
          <>
            {chosen.map((service) => (
              <section className="grid gap-4 rounded-md border border-border p-4" key={service.key}>
                <h3 className="font-bold">{service.label}</h3>
                {service.questions.map((question) => (
                  <label className="grid gap-2 font-semibold" key={question.key}>
                    {question.label}
                    {question.type === "boolean" ? (
                      <select
                        className="min-h-11 rounded-md border border-input bg-background px-3"
                        required={question.required}
                        value={String(answers[service.key]?.[question.key] ?? "")}
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [service.key]: {
                              ...current[service.key],
                              [question.key]: event.target.value === "true",
                            },
                          }))
                        }
                      >
                        <option value="">Choose</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : question.type === "select" ? (
                      <select
                        className="min-h-11 rounded-md border border-input bg-background px-3"
                        required={question.required}
                        value={String(answers[service.key]?.[question.key] ?? "")}
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [service.key]: {
                              ...current[service.key],
                              [question.key]: event.target.value,
                            },
                          }))
                        }
                      >
                        <option value="">Choose</option>
                        {question.options?.map((option) => (
                          <option key={option} value={option}>
                            {option.replaceAll("-", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="min-h-11 rounded-md border border-input bg-background px-3"
                        min={0}
                        required={question.required}
                        type={question.type}
                        value={String(answers[service.key]?.[question.key] ?? "")}
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [service.key]: {
                              ...current[service.key],
                              [question.key]:
                                question.type === "number"
                                  ? Number(event.target.value)
                                  : event.target.value,
                            },
                          }))
                        }
                      />
                    )}
                  </label>
                ))}
              </section>
            ))}
          </>
        ) : null}
        {step === 3 ? (
          <>
            <label className="grid gap-2 font-semibold">
              Street address
              <input
                className="min-h-11 rounded-md border border-input bg-background px-3"
                required
                value={address.line1}
                onChange={(event) => setAddress({ ...address, line1: event.target.value })}
              />
            </label>
            <label className="grid gap-2 font-semibold">
              Unit <span className="text-sm font-normal text-muted-foreground">Optional</span>
              <input
                className="min-h-11 rounded-md border border-input bg-background px-3"
                value={address.line2}
                onChange={(event) => setAddress({ ...address, line2: event.target.value })}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 font-semibold">
                Service area
                <select
                  className="min-h-11 rounded-md border border-input bg-background px-3"
                  required
                  value={address.serviceAreaKey}
                  onChange={(event) => {
                    const area = areas.find(({ key }) => key === event.target.value);
                    setAddress({
                      ...address,
                      serviceAreaKey: event.target.value,
                      city: area?.label ?? "",
                    });
                  }}
                >
                  <option value="">Choose an approved area</option>
                  {areas.map((area) => (
                    <option key={area.key} value={area.key}>
                      {area.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 font-semibold">
                Postal code
                <input
                  className="min-h-11 rounded-md border border-input bg-background px-3 uppercase"
                  required
                  value={address.postalCode}
                  onChange={(event) => setAddress({ ...address, postalCode: event.target.value })}
                  placeholder="A1A 1A1"
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              CTPS currently accepts requests in the listed British Columbia service areas. Staff
              will confirm final serviceability.
            </p>
          </>
        ) : null}
        {step === 4 ? (
          <>
            {dates.map((date, index) => (
              <label className="grid gap-2 font-semibold" key={index}>
                Preferred date {index + 1}{" "}
                <span className="text-sm font-normal text-muted-foreground">Optional</span>
                <input
                  className="min-h-11 rounded-md border border-input bg-background px-3"
                  min={new Date().toISOString().slice(0, 10)}
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDates((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    )
                  }
                />
              </label>
            ))}
            {dates.length < 3 ? (
              <button
                className="justify-self-start text-sm font-semibold text-primary"
                onClick={() => setDates((current) => [...current, ""])}
                type="button"
              >
                + Add another preferred date
              </button>
            ) : null}
            <label className="grid gap-2 font-semibold">
              Anything else we should know?{" "}
              <span className="text-sm font-normal text-muted-foreground">Optional</span>
              <textarea
                className="min-h-28 rounded-md border border-input bg-background p-3"
                maxLength={3000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
          </>
        ) : null}
        {step === 5 ? (
          <>
            <div className="rounded-md border border-dashed border-border p-5">
              <label className="grid cursor-pointer gap-2 text-center font-semibold">
                Add optional property photos
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="mx-auto max-w-full"
                  multiple
                  onChange={(event) => void addFiles(event.target.files)}
                  type="file"
                />
                <span className="text-xs font-normal text-muted-foreground">
                  JPEG, PNG, or WebP. Up to 8 images; images are private and used only to review
                  this request.
                </span>
              </label>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {uploads.map((upload, index) => (
                <li className="overflow-hidden rounded-md border border-border" key={upload.id}>
                  <img
                    alt="Selected property preview"
                    className="aspect-video w-full object-cover"
                    src={upload.url}
                  />
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{upload.filename}</p>
                    <p className="text-xs text-muted-foreground">{upload.state}</p>
                    <div className="mt-2 flex gap-3">
                      {upload.state === "error" && upload.file ? (
                        <button
                          onClick={() => {
                            void remove(upload).then(() => addFiles([upload.file!]));
                          }}
                          type="button"
                        >
                          Retry
                        </button>
                      ) : null}
                      <button
                        disabled={index === 0 || upload.state !== "ready"}
                        onClick={() => void move(index, -1)}
                        type="button"
                      >
                        Move up
                      </button>
                      <button
                        disabled={index === uploads.length - 1 || upload.state !== "ready"}
                        onClick={() => void move(index, 1)}
                        type="button"
                      >
                        Move down
                      </button>
                      <button
                        className="text-destructive"
                        onClick={() => void remove(upload)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {step === 6 ? (
          <>
            <label className="grid gap-2 font-semibold">
              Full name
              <input
                autoComplete="name"
                className="min-h-11 rounded-md border border-input bg-background px-3"
                required
                value={contact.fullName}
                onChange={(event) => setContact({ ...contact, fullName: event.target.value })}
              />
            </label>
            <label className="grid gap-2 font-semibold">
              Email
              <input
                autoComplete="email"
                className="min-h-11 rounded-md border border-input bg-background px-3"
                required
                type="email"
                value={contact.email}
                onChange={(event) => setContact({ ...contact, email: event.target.value })}
              />
            </label>
            <label className="grid gap-2 font-semibold">
              Phone
              <input
                autoComplete="tel"
                className="min-h-11 rounded-md border border-input bg-background px-3"
                required
                type="tel"
                value={contact.phone}
                onChange={(event) => setContact({ ...contact, phone: event.target.value })}
              />
            </label>
            <label className="grid gap-2 font-semibold">
              Preferred contact method
              <select
                className="min-h-11 rounded-md border border-input bg-background px-3"
                value={contact.preferredMethod}
                onChange={(event) =>
                  setContact({ ...contact, preferredMethod: event.target.value })
                }
              >
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
                <option value="TEXT">Text message</option>
              </select>
            </label>
            <label className="grid gap-2 font-semibold">
              Company name{" "}
              <span className="text-sm font-normal text-muted-foreground">Optional</span>
              <input
                autoComplete="organization"
                className="min-h-11 rounded-md border border-input bg-background px-3"
                value={contact.companyName}
                onChange={(event) => setContact({ ...contact, companyName: event.target.value })}
              />
            </label>
          </>
        ) : null}
        {step === 7 ? (
          <>
            <div className="grid gap-3 rounded-md bg-surface-muted p-5 text-sm">
              <p>
                <strong>Property:</strong> {propertyType.toLowerCase()}
              </p>
              <p>
                <strong>Services:</strong>{" "}
                {chosen.map(({ label }) => label).join(", ") || "None selected"}
              </p>
              <p>
                <strong>Address:</strong> {address.line1}, {address.city}, BC {address.postalCode}
              </p>
              <p>
                <strong>Preferred dates:</strong> {dates.filter(Boolean).join(", ") || "Flexible"}
              </p>
              <p>
                <strong>Photos:</strong> {uploads.filter(({ state }) => state === "ready").length}
              </p>
              <p>
                <strong>Contact:</strong> {contact.fullName}, {contact.email}, {contact.phone}
              </p>
            </div>
            <label className="flex gap-3 rounded-md border border-border p-4 text-sm">
              <input
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
                type="checkbox"
              />
              <span>
                I consent to CTPS using these contact, property, and optional photo details to
                review and respond to this quote request. I understand this submission confirms
                receipt only and is not a quote, price, appointment, or booking.
              </span>
            </label>
          </>
        ) : null}
      </fieldset>
      <div className="mt-8 flex flex-wrap justify-between gap-3">
        <button
          className="min-h-11 rounded-md border border-border px-5 font-semibold disabled:opacity-50"
          disabled={step === 0 || busy}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          type="button"
        >
          Back
        </button>
        {step < 7 ? (
          <button
            className="min-h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50"
            disabled={!draftToken || busy}
            onClick={next}
            type="button"
          >
            Continue
          </button>
        ) : (
          <button
            className="min-h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50"
            disabled={!draftToken || busy || uploads.some(({ state }) => state === "uploading")}
            onClick={() => void submit()}
            type="button"
          >
            {busy ? "Submitting…" : "Submit quote request"}
          </button>
        )}
      </div>
    </div>
  );
}
