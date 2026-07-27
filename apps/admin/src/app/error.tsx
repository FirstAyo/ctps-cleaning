"use client";
import { useEffect } from "react";
import { Button } from "@ctps/ui/primitives";
export default function ErrorPage({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    void error.digest;
  }, [error]);
  return (
    <main className="mx-auto max-w-2xl p-8">
      <p className="text-sm font-semibold text-muted-foreground">Administration error</p>
      <h1 className="mt-2 text-3xl font-semibold">The operation could not be displayed.</h1>
      <p className="mt-4 text-muted-foreground">
        Try again. Sensitive details and stack traces are intentionally not shown.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
