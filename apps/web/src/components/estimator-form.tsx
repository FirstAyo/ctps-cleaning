"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Answer = string | number | boolean;
type Question = {
  key: string;
  label: string;
  helpText: string;
  type: "number" | "boolean" | "select";
  options?: string[];
  minimum?: number;
  maximum?: number;
};
type Configuration = {
  province: string;
  serviceAreas: { key: string; label: string }[];
  services: { serviceKey: string; questions: Question[] }[];
  disclaimer: string;
};
const labels: Record<string, string> = {
  "window-cleaning": "Window cleaning",
  "pressure-washing": "Pressure washing",
  "gutter-cleaning": "Gutter cleaning",
  "moss-removal": "Moss removal",
  "vent-cleaning": "Vent cleaning",
};
const steps = ["Service", "Property", "Location", "Details", "Review", "Calculate"];

export function EstimatorForm({ initialService = "" }: { initialService?: string }) {
  const router = useRouter();
  const [configuration, setConfiguration] = useState<Configuration>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [serviceKey, setServiceKey] = useState(initialService);
  const [customerType, setCustomerType] = useState("RESIDENTIAL");
  const [serviceAreaKey, setServiceAreaKey] = useState("");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  useEffect(() => {
    void fetch("/api/estimator/configuration", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as Configuration & { message?: string };
        if (!response.ok) throw new Error(body.message ?? "The estimator is unavailable.");
        setConfiguration(body);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "The estimator is unavailable."),
      );
  }, []);
  const service = useMemo(
    () => configuration?.services.find((item) => item.serviceKey === serviceKey),
    [configuration, serviceKey],
  );
  const valid =
    step === 0
      ? !!service
      : step === 1
        ? !!customerType
        : step === 2
          ? !!serviceAreaKey
          : step === 3
            ? !!service &&
              service.questions.every(
                (question) => answers[question.key] !== undefined && answers[question.key] !== "",
              )
            : true;
  async function calculate() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/estimator/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          honeypot: "",
          serviceKey,
          customerType,
          serviceAreaKey,
          answers,
        }),
      });
      const body = (await response.json()) as { token?: string; message?: string };
      if (!response.ok || !body.token)
        throw new Error(body.message ?? "The estimate could not be calculated.");
      router.push(`/estimate/results/${body.token}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The estimate could not be calculated.");
      setBusy(false);
    }
  }
  if (error && !configuration)
    return (
      <div className="rounded-xl border border-border bg-surface-muted p-6">
        <h2 className="font-bold">Estimator temporarily unavailable</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <a className="mt-4 inline-block font-semibold text-primary" href="/request-a-quote">
          Request a quote instead
        </a>
      </div>
    );
  return (
    <div
      className="rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-8"
      aria-live="polite"
    >
      <ol className="mb-8 grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
        {steps.map((name, index) => (
          <li
            className={index === step ? "font-bold text-primary" : "text-muted-foreground"}
            key={name}
          >
            {index + 1}. {name}
          </li>
        ))}
      </ol>
      {error ? (
        <p className="mb-5 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      ) : null}
      <fieldset className="grid gap-5" disabled={busy}>
        <legend className="mb-5 text-2xl font-bold">{steps[step]}</legend>
        {step === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {configuration?.services.map((item) => (
              <button
                className={`min-h-16 rounded-lg border p-4 text-left font-semibold ${serviceKey === item.serviceKey ? "border-primary bg-primary/5" : "border-border"}`}
                key={item.serviceKey}
                onClick={() => {
                  setServiceKey(item.serviceKey);
                  setAnswers({});
                }}
                type="button"
              >
                {labels[item.serviceKey] ?? item.serviceKey}
              </button>
            ))}
          </div>
        ) : null}
        {step === 1 ? (
          <label className="grid gap-2 font-semibold">
            Property type
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3"
              value={customerType}
              onChange={(event) => setCustomerType(event.target.value)}
            >
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </label>
        ) : null}
        {step === 2 ? (
          <>
            <label className="grid gap-2 font-semibold">
              British Columbia service area
              <select
                className="min-h-11 rounded-md border border-input bg-background px-3"
                value={serviceAreaKey}
                onChange={(event) => setServiceAreaKey(event.target.value)}
              >
                <option value="">Choose an approved area</option>
                {configuration?.serviceAreas.map((area) => (
                  <option key={area.key} value={area.key}>
                    {area.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-muted-foreground">
              Only the currently approved CTPS service areas are listed. Final serviceability is
              confirmed by staff.
            </p>
          </>
        ) : null}
        {step === 3
          ? service?.questions.map((question) => (
              <label className="grid gap-2 font-semibold" key={question.key}>
                {question.label}
                {question.type === "select" || question.type === "boolean" ? (
                  <select
                    className="min-h-11 rounded-md border border-input bg-background px-3"
                    value={String(answers[question.key] ?? "")}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.key]:
                          question.type === "boolean"
                            ? event.target.value === "true"
                            : event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose</option>
                    {question.type === "boolean" ? (
                      <>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </>
                    ) : (
                      question.options?.map((option) => (
                        <option key={option} value={option}>
                          {option.replaceAll("-", " ")}
                        </option>
                      ))
                    )}
                  </select>
                ) : (
                  <input
                    className="min-h-11 rounded-md border border-input bg-background px-3"
                    min={question.minimum}
                    max={question.maximum}
                    type="number"
                    value={String(answers[question.key] ?? "")}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.key]: Number(event.target.value),
                      }))
                    }
                  />
                )}
                <span className="text-xs font-normal text-muted-foreground">
                  {question.helpText}
                </span>
              </label>
            ))
          : null}
        {step === 4 ? (
          <div className="grid gap-3 rounded-lg bg-surface-muted p-5 text-sm">
            <p>
              <strong>Service:</strong> {labels[serviceKey]}
            </p>
            <p>
              <strong>Property:</strong> {customerType.toLowerCase()}
            </p>
            <p>
              <strong>Area:</strong>{" "}
              {configuration?.serviceAreas.find((area) => area.key === serviceAreaKey)?.label},
              British Columbia
            </p>
            <p>
              <strong>Answers:</strong>{" "}
              {Object.entries(answers)
                .map(([key, value]) => `${key}: ${String(value)}`)
                .join("; ")}
            </p>
            <p>{configuration?.disclaimer}</p>
          </div>
        ) : null}
        {step === 5 ? (
          <div className="rounded-lg border border-border p-5">
            <p className="font-semibold">Ready to calculate your preliminary range.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The server uses the currently effective published pricing version. Your internal
              calculation trace is never exposed here.
            </p>
          </div>
        ) : null}
      </fieldset>
      <div className="mt-8 flex justify-between gap-3">
        <button
          className="min-h-11 rounded-md border border-border px-5 font-semibold disabled:opacity-50"
          disabled={step === 0 || busy}
          onClick={() => setStep((value) => value - 1)}
          type="button"
        >
          Back
        </button>
        {step < 5 ? (
          <button
            className="min-h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50"
            disabled={!valid || busy}
            onClick={() => setStep((value) => value + 1)}
            type="button"
          >
            Continue
          </button>
        ) : (
          <button
            className="min-h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50"
            disabled={busy}
            onClick={() => void calculate()}
            type="button"
          >
            {busy ? "Calculating…" : "Calculate preliminary estimate"}
          </button>
        )}
      </div>
    </div>
  );
}
