"use client";
import { useState } from "react";
import { Button } from "@ctps/ui/primitives";
import { useRouter } from "next/navigation";

export function RevokeOtherSessionsButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div>
      <Button
        disabled={pending}
        onClick={async () => {
          if (!window.confirm("Revoke every other active session?")) return;
          setPending(true);
          const response = await fetch("/api/auth/revoke-others", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{}",
          });
          const body = (await response.json()) as { revoked?: number; message?: string };
          setMessage(
            response.ok
              ? `${body.revoked ?? 0} other session(s) revoked.`
              : (body.message ?? "Unable to revoke sessions."),
          );
          setPending(false);
          router.refresh();
        }}
        variant="outline"
      >
        {pending ? "Revoking…" : "Revoke other sessions"}
      </Button>
      {message ? (
        <p aria-live="polite" className="mt-2 text-sm">
          {message}
        </p>
      ) : null}
    </div>
  );
}
