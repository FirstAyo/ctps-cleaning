import { Forbidden } from "@/components/forbidden";
import { JobCreateForm } from "@/components/job-create-form";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ quoteId?: string }>;
}) {
  const identity = await currentIdentity();
  if (
    !identity ||
    (!can(identity, "jobs.createFromQuote") && !can(identity, "jobs.createInternal"))
  )
    return <Forbidden />;
  const eligibleQuotes = can(identity, "jobs.createFromQuote")
    ? (
        await adminApi<{
          items: { id: string; reference: string; customerName: string; status: string }[];
        }>("admin/jobs/eligible-quotes")
      ).items
    : [];
  const { quoteId } = await searchParams;
  return (
    <div className="grid gap-6">
      <header>
        <h2 className="text-2xl font-semibold">Create operational job</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff records the appointment; this does not create public booking or payment access.
        </p>
      </header>
      <JobCreateForm
        canCreateInternal={can(identity, "jobs.createInternal")}
        {...(quoteId ? { defaultQuoteId: quoteId } : {})}
        eligibleQuotes={eligibleQuotes}
      />
    </div>
  );
}
