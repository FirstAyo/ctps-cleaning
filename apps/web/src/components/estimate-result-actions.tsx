"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function EstimateResultActions({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function transfer() {
    setBusy(true);
    const response = await fetch(`/api/estimator/results/${token}/quote-transfer`, {
      method: "POST",
    });
    const body = (await response.json()) as { quotePath?: string; message?: string };
    if (!response.ok || !body.quotePath) {
      setError(body.message ?? "The quote transfer could not be created.");
      setBusy(false);
      return;
    }
    router.push(body.quotePath);
  }
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        className="min-h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground"
        disabled={busy}
        onClick={() => void transfer()}
        type="button"
      >
        {busy ? "Preparing…" : "Use this estimate in a quote request"}
      </button>
      <a
        className="min-h-11 rounded-md border border-border px-6 py-2.5 font-semibold"
        href="/estimate"
      >
        Start another estimate
      </a>
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
