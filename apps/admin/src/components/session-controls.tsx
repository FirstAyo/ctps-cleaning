"use client";
import { useState } from "react";
import { Button } from "@ctps/ui/primitives";
import { useConfirmation } from "@ctps/ui/navigation";
import { useToast } from "@ctps/ui/toast";
import { useRouter } from "next/navigation";

export function RevokeOtherSessionsButton() {
  const router = useRouter();
  const confirm = useConfirmation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div>
      <Button
        disabled={pending}
        onClick={async () => {
          if (
            !(await confirm({
              title: "Revoke other sessions?",
              description:
                "Every other active session will be signed out. Your current session remains active.",
              confirmLabel: "Revoke sessions",
              destructive: true,
            }))
          )
            return;
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
          toast({
            title: response.ok ? "Other sessions revoked" : "Sessions were not revoked",
            description: response.ok
              ? `${body.revoked ?? 0} other active session(s) were revoked.`
              : (body.message ?? "Unable to revoke sessions."),
            tone: response.ok ? "success" : "error",
          });
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
