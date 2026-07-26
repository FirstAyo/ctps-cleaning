/* eslint-disable @next/next/no-img-element -- private job media is streamed through an authenticated no-store route */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Forbidden } from "@/components/forbidden";
import { JobActions } from "@/components/job-actions";
import {
  JobAssignmentControls,
  JobChecklistControls,
  JobIncidentControls,
  JobMediaControls,
  JobMediaUploader,
  JobNoteControls,
} from "@/components/job-inline-controls";
import { AdminApiError, adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { JobDetail } from "@/lib/job-types";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const identity = await currentIdentity();
  if (!identity || (!can(identity, "jobs.read") && !can(identity, "jobs.readAssigned")))
    return <Forbidden />;
  const { id } = await params;
  let job: JobDetail;
  try {
    job = await adminApi<JobDetail>(`admin/jobs/${id}`);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }
  const staff = can(identity, "jobs.assign")
    ? (await adminApi<{ items: { id: string; displayName: string }[] }>("admin/jobs/staff")).items
    : [];
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Vancouver",
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "Not recorded";
  const activeAssignments = job.assignments.filter(
    (item) => !("unassignedAt" in item) || !item.unassignedAt,
  );
  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-semibold text-primary">{job.referenceNumber}</p>
        <h2 className="text-2xl font-semibold">{job.status}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Private operational record · Version {job.version} · Vancouver time
        </p>
        <p className="mt-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
          Contains private customer, property, staff, incident, and operational information. Do not
          share this page publicly.
        </p>
      </header>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <main className="grid gap-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Customer and property snapshot</h3>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Customer</dt>
                <dd>
                  {job.customerNameSnapshot}
                  <br />
                  {job.customerEmailSnapshot}
                  <br />
                  {job.customerPhoneSnapshot}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Property</dt>
                <dd>
                  {job.propertyAddressLine1Snapshot}
                  {job.propertyAddressLine2Snapshot ? (
                    <>
                      <br />
                      {job.propertyAddressLine2Snapshot}
                    </>
                  ) : null}
                  <br />
                  {job.citySnapshot}, {job.province} {job.postalCodeSnapshot}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Type</dt>
                <dd>
                  {job.customerType} · {job.propertyTypeSnapshot}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Area</dt>
                <dd>{job.serviceAreaKey}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Service scope</h3>
            <p className="mt-3 whitespace-pre-wrap">{job.serviceScopeSummary}</p>
            <p className="mt-3 text-sm">
              Services: {job.services.map((item) => item.serviceKey).join(", ")}
            </p>
            {job.accessNotes ? (
              <p className="mt-3 whitespace-pre-wrap text-sm">
                <strong>Access:</strong> {job.accessNotes}
              </p>
            ) : null}
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Schedule and timing</h3>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Scheduled</dt>
                <dd>
                  {date(job.scheduledStartAt)}–
                  {job.scheduledEndAt
                    ? new Intl.DateTimeFormat("en-CA", {
                        timeZone: "America/Vancouver",
                        timeStyle: "short",
                      }).format(new Date(job.scheduledEndAt))
                    : "unconfirmed"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Estimated duration</dt>
                <dd>
                  {job.estimatedDurationMinutes
                    ? `${job.estimatedDurationMinutes} minutes`
                    : "Not set"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Arrival</dt>
                <dd>{date(job.actualArrivalAt)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Service timing</dt>
                <dd>
                  {date(job.actualStartAt)} → {date(job.actualEndAt)}
                </dd>
              </div>
            </dl>
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Assigned team</h3>
            {activeAssignments.length ? (
              <ul className="mt-3 grid gap-2 text-sm">
                {activeAssignments.map((item, index) => (
                  <li key={`${item.user.id}-${index}`}>
                    {item.user.displayName} — {item.assignmentRole}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No active assignments.</p>
            )}
            <div className="mt-3">
              <JobAssignmentControls
                assignments={job.assignments.map((item, index) => ({
                  id: "id" in item && typeof item.id === "string" ? item.id : `${index}`,
                  user: item.user,
                  assignmentRole: item.assignmentRole,
                  unassignedAt:
                    "unassignedAt" in item && typeof item.unassignedAt === "string"
                      ? item.unassignedAt
                      : null,
                }))}
                canManage={can(identity, "jobs.assign")}
                jobId={job.id}
              />
            </div>
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Checklist</h3>
            {job.checklistItems.length ? (
              <ol className="mt-3 grid gap-3">
                {job.checklistItems.map((item) => (
                  <li className="rounded-md bg-surface-muted p-3 text-sm" key={item.id}>
                    <strong>
                      {item.completed ? "Completed" : "Open"}
                      {item.required ? " · Required" : ""}
                    </strong>
                    <br />
                    {item.label}
                    <br />
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No checklist items.</p>
            )}
            <div className="mt-3">
              <JobChecklistControls
                canManage={can(identity, "jobs.manageChecklist")}
                items={job.checklistItems}
                jobId={job.id}
                version={job.version}
              />
            </div>
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Private job media</h3>
            {job.media.length ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {job.media.map((media) => (
                  <figure
                    className="overflow-hidden rounded-md border border-border"
                    key={media.id}
                  >
                    <img
                      alt={media.altText || "Private operational job photo"}
                      className="aspect-video w-full object-cover"
                      src={`/api/job-media/${job.id}/${media.id}/standard`}
                    />
                    <figcaption className="p-2 text-xs">
                      {media.category}
                      {media.caption ? ` · ${media.caption}` : ""}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No private photos.</p>
            )}
            <div className="mt-4">
              <JobMediaUploader
                canUpload={can(identity, "jobs.uploadPrivateMedia")}
                jobId={job.id}
              />
            </div>
            <JobMediaControls
              canDelete={can(identity, "jobs.deletePrivateMedia")}
              canUpdate={can(identity, "jobs.uploadPrivateMedia")}
              jobId={job.id}
              media={job.media}
            />
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Notes</h3>
            {job.customerSchedulingNotes ? (
              <p className="mt-3 whitespace-pre-wrap text-sm">
                <strong>Customer-facing scheduling note:</strong> {job.customerSchedulingNotes}
              </p>
            ) : null}
            {job.internalOperationalNotes ? (
              <p className="mt-3 whitespace-pre-wrap rounded-md bg-surface-muted p-3 text-sm">
                <strong>Private operational note:</strong> {job.internalOperationalNotes}
              </p>
            ) : null}
            <ul className="mt-3 grid gap-2">
              {job.notes.map((note) => (
                <li className="rounded-md border border-border p-3 text-sm" key={note.id}>
                  <strong>
                    {note.visibility === "INTERNAL" ? "Private internal" : "Customer-facing"}
                  </strong>
                  <p className="whitespace-pre-wrap">{note.body}</p>
                  <small>
                    {note.author.displayName} · {date(note.createdAt)}
                  </small>
                </li>
              ))}
            </ul>
            <JobNoteControls
              canManageInternal={can(identity, "jobs.addInternalNotes")}
              canUpdateJob={can(identity, "jobs.update")}
              currentUserId={identity.id}
              jobId={job.id}
              notes={job.notes}
            />
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Incidents</h3>
            {job.incidents.length ? (
              <ul className="mt-3 grid gap-3">
                {job.incidents.map((incident) => (
                  <li className="rounded-md border border-border p-3 text-sm" key={incident.id}>
                    <strong>
                      {incident.severity}: {incident.title}
                    </strong>
                    <p className="whitespace-pre-wrap">{incident.description}</p>
                    <p>
                      {incident.resolvedAt
                        ? `Resolved ${date(incident.resolvedAt)}`
                        : incident.blocksCompletion
                          ? "Open · Blocks completion"
                          : "Open"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No incidents.</p>
            )}
            <div className="mt-3">
              <JobIncidentControls
                canManage={can(identity, "jobs.manageIncidents")}
                incidents={job.incidents}
                jobId={job.id}
              />
            </div>
          </section>
          {job.completionSummary ? (
            <section className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-lg font-semibold">Completion and follow-up</h3>
              <p className="mt-3 whitespace-pre-wrap">{job.completionSummary}</p>
              <p className="mt-2 text-sm">
                Follow-up: {job.followUpRequired ? "Required" : "Not required"}
              </p>
              {job.followUpNotes ? (
                <p className="mt-2 whitespace-pre-wrap text-sm">{job.followUpNotes}</p>
              ) : null}
            </section>
          ) : null}
        </main>
        <aside className="grid content-start gap-6">
          <JobActions
            jobId={job.id}
            permissions={identity.permissions}
            staff={staff}
            status={job.status}
            version={job.version}
          />
          {job.quoteRequest ? (
            <section className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold">Source quote</h3>
              <Link
                className="mt-2 block underline"
                href={`/quote-requests/${job.quoteRequest.id}`}
              >
                {job.quoteRequest.reference}
              </Link>
              {job.quoteRequest.estimateSnapshot ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Preliminary estimate — not a final quote.
                </p>
              ) : null}
            </section>
          ) : (
            <section className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold">Source</h3>
              <p className="mt-2 text-sm">Staff-created job; no quote request was fabricated.</p>
            </section>
          )}
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">Status history</h3>
            <ul className="mt-3 grid gap-2 text-xs">
              {job.statusHistory.map((entry) => (
                <li key={entry.id}>
                  {entry.previousStatus} → {entry.newStatus}
                  <br />
                  <span className="text-muted-foreground">
                    {entry.changedBy.displayName} · {date(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">Schedule history</h3>
            <ul className="mt-3 grid gap-2 text-xs">
              {job.scheduleHistory.map((entry) => (
                <li key={entry.id}>
                  {date(entry.newStartAt)} · {entry.reason}
                  {entry.conflictOverridden ? " · Conflict overridden" : ""}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">Email outbox</h3>
            {job.emailMessages.length ? (
              <ul className="mt-3 grid gap-2 text-xs">
                {job.emailMessages.map((entry) => (
                  <li key={entry.id}>
                    {entry.templateKey}: <strong>{entry.status}</strong>
                    {entry.lastErrorCode ? ` (${entry.lastErrorCode})` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No customer notification queued.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
