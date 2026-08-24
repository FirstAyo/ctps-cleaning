import { notFound } from "next/navigation";
import { Forbidden } from "@/components/forbidden";
import { GeneralInquiryActions } from "@/components/general-inquiry-actions";
import { AdminApiError, adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { GeneralInquiryDetail } from "@/lib/general-inquiry-types";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "generalInquiries.read")) return <Forbidden />;
  const { id } = await params;
  let inquiry: GeneralInquiryDetail;
  try {
    inquiry = await adminApi<GeneralInquiryDetail>(`admin/general-inquiries/${id}`);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  }
  const date = (value: string) =>
    new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
    );

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-primary">General inquiry</p>
        <h2 className="text-2xl font-semibold">{inquiry.name}</h2>
        <p className="text-sm text-muted-foreground">
          Received {date(inquiry.createdAt)} · {inquiry.status === "NEW" ? "New" : "Read"}
        </p>
      </div>
      <GeneralInquiryActions
        archived={Boolean(inquiry.archivedAt)}
        canArchive={can(identity, "generalInquiries.archive")}
        canUpdate={can(identity, "generalInquiries.update")}
        id={inquiry.id}
        status={inquiry.status}
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-semibold">Message</h3>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{inquiry.message}</p>
        </section>
        <aside className="grid content-start gap-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">Sender details</h3>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="font-semibold">Email</dt>
                <dd>
                  <a className="underline" href={`mailto:${inquiry.email}`}>
                    {inquiry.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Phone</dt>
                <dd>{inquiry.phone ?? "Not supplied"}</dd>
              </div>
              <div>
                <dt className="font-semibold">Service interest</dt>
                <dd>{inquiry.serviceKey ?? "General question"}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">Email delivery</h3>
            <ul className="mt-3 grid gap-2 text-xs">
              {inquiry.emailMessages.map((item) => (
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
