"use client";

import { useState } from "react";
import { Button } from "@ctps/ui/primitives";
import { useToast } from "@ctps/ui/toast";
import { useRouter } from "next/navigation";

async function mutate(id: string, action: "read" | "archive", body: object) {
  const response = await fetch(`/api/admin/general-inquiries/${id}/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(result.message ?? "The inquiry could not be updated.");
}

export function GeneralInquiryActions({
  archived,
  canArchive,
  canUpdate,
  id,
  status,
}: {
  readonly archived: boolean;
  readonly canArchive: boolean;
  readonly canUpdate: boolean;
  readonly id: string;
  readonly status: "NEW" | "READ";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function run(action: "read" | "archive", body: object, title: string) {
    setBusy(true);
    try {
      await mutate(id, action, body);
      toast({ title, tone: "success" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canUpdate ? (
        <Button
          disabled={busy}
          onClick={() =>
            run(
              "read",
              { read: status === "NEW" },
              status === "NEW" ? "Marked as read" : "Marked as unread",
            )
          }
          type="button"
          variant="outline"
        >
          Mark as {status === "NEW" ? "read" : "unread"}
        </Button>
      ) : null}
      {canArchive ? (
        <Button
          disabled={busy}
          onClick={() =>
            run(
              "archive",
              { archive: !archived },
              archived ? "Inquiry restored" : "Inquiry archived",
            )
          }
          type="button"
          variant="outline"
        >
          {archived ? "Restore" : "Archive"}
        </Button>
      ) : null}
    </div>
  );
}
