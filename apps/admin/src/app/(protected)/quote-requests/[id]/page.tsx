/* eslint-disable @next/next/no-img-element -- private images use an authenticated, no-store BFF route */
import { notFound } from "next/navigation";
import Link from "next/link";
import { Forbidden } from "@/components/forbidden";
import { QuoteRequestActions } from "@/components/quote-request-actions";
import { AdminApiError, adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { QuoteDetail } from "@/lib/quote-request-types";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "quoteRequests.read")) return <Forbidden />;
  const { id } = await params;
  let quote: QuoteDetail;
  try {
    quote = await adminApi<QuoteDetail>(`admin/quote-requests/${id}`);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }
  let assignees: { id: string; displayName: string; email: string }[] = [];
  if (can(identity, "quoteRequests.assign")) {
    const result = await adminApi<{ items: typeof assignees }>("admin/quote-requests-assignees");
    assignees = result.items;
  }
  const date = (value: string) =>
    new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
    );
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-primary">{quote.reference}</p>
        <h2 className="text-2xl font-semibold">{quote.customerName}</h2>
        <p className="text-sm text-muted-foreground">
          Received {date(quote.createdAt)} · {quote.status} ·{" "}
          {quote.assignedTo?.displayName ?? "Unassigned"}
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
        <div className="grid gap-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Customer and property</h3>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Contact</dt>
                <dd>
                  {quote.customerEmail}
                  <br />
                  {quote.customerPhone}
                  <br />
                  Prefers {quote.preferredContactMethod.toLowerCase()}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Address</dt>
                <dd>
                  {quote.addressLine1}
                  {quote.addressLine2 ? (
                    <>
                      <br />
                      {quote.addressLine2}
                    </>
                  ) : null}
                  <br />
                  {quote.city}, {quote.province} {quote.postalCode}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Property</dt>
                <dd>
                  {quote.propertyType.toLowerCase()} · {quote.serviceAreaKey}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Company</dt>
                <dd>{quote.companyName ?? "Not supplied"}</dd>
              </div>
              <div>
                <dt className="font-semibold">Preferred dates</dt>
                <dd>{quote.preferredDates.join(", ") || "Flexible"}</dd>
              </div>
              <div>
                <dt className="font-semibold">Consent</dt>
                <dd>Accepted {date(quote.consentAcceptedAt)}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Requested services</h3>
            <p className="mt-3">{quote.services.join(", ")}</p>
            <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-md bg-surface-muted p-4 text-xs">
              {JSON.stringify(quote.serviceAnswers, null, 2)}
            </pre>
            {quote.notes ? (
              <p className="mt-4 whitespace-pre-wrap text-sm">
                <strong>Customer notes:</strong> {quote.notes}
              </p>
            ) : null}
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Operational job</h3>
            {quote.serviceJobs.length ? (
              <p className="mt-3 text-sm">
                Linked job:{" "}
                <Link
                  className="font-semibold underline"
                  href={`/jobs/${quote.serviceJobs[0]!.id}`}
                >
                  {quote.serviceJobs[0]!.referenceNumber}
                </Link>{" "}
                · {quote.serviceJobs[0]!.status}
              </p>
            ) : can(identity, "jobs.createFromQuote") &&
              ["ACCEPTED", "QUOTE_PREPARED", "CONTACTED"].includes(quote.status) ? (
              <Link
                className="mt-3 inline-block rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
                href={`/jobs/new?quoteId=${quote.id}`}
              >
                Create Job
              </Link>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No linked job. The request must be eligible and you need job-conversion permission.
              </p>
            )}
          </section>
          {quote.estimateResult ? (
            <section className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-lg font-semibold">Linked preliminary estimate</h3>
              <p className="mt-2 text-sm">
                Match state: <strong>{quote.estimateMatchStatus}</strong> ·{" "}
                {quote.estimateResult.serviceKey} · {quote.estimateResult.outcome}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Pricing version {quote.estimateResult.pricingVersionCode}. This historical range is
                informational and is not the formal quote.
              </p>
            </section>
          ) : null}
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Private customer photos</h3>
            {can(identity, "quoteRequests.readPrivateMedia") ? (
              quote.uploads.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {quote.uploads.map((upload) => (
                    <figure
                      className="overflow-hidden rounded-md border border-border"
                      key={upload.id}
                    >
                      <img
                        alt={`Private quote upload ${upload.sortOrder + 1}`}
                        className="aspect-video w-full object-cover"
                        src={`/api/quote-media/${quote.id}/${upload.id}`}
                      />
                      <figcaption className="p-2 text-xs">{upload.originalFilename}</figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No photos were attached.</p>
              )
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                You do not have permission to view private customer media.
              </p>
            )}
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Internal notes</h3>
            {quote.internalNotes.length ? (
              <ul className="mt-4 grid gap-3">
                {quote.internalNotes.map((note) => (
                  <li className="rounded-md bg-surface-muted p-3 text-sm" key={note.id}>
                    <p className="whitespace-pre-wrap">{note.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {note.author.displayName} · {date(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No internal notes.</p>
            )}
          </section>
        </div>
        <aside className="grid content-start gap-6">
          <QuoteRequestActions
            assignedToUserId={quote.assignedTo?.id ?? null}
            archived={Boolean(quote.archivedAt)}
            assignees={assignees}
            id={quote.id}
            permissions={identity.permissions}
            status={quote.status}
          />
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">Status history</h3>
            {quote.statusHistory.length ? (
              <ul className="mt-3 grid gap-2 text-xs">
                {quote.statusHistory.map((item) => (
                  <li key={item.id}>
                    {item.fromStatus} → {item.toStatus}
                    <br />
                    <span className="text-muted-foreground">
                      {item.actor.displayName} · {date(item.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No changes yet.</p>
            )}
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">Email delivery</h3>
            <ul className="mt-3 grid gap-2 text-xs">
              {quote.emailMessages.map((item) => (
                <li key={item.templateKey}>
                  {item.templateKey}: <strong>{item.status}</strong>
                  {item.lastErrorCode ? ` (${item.lastErrorCode})` : ""}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
