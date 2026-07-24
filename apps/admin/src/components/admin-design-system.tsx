import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@ctps/ui/content";
import { Inline } from "@ctps/ui/layout";
import { AlertDialog, Dialog, Drawer, Pagination, ToastDemo } from "@ctps/ui/navigation";
import {
  Button,
  FieldGroup,
  FormDescription,
  FormError,
  Input,
  Label,
  Select,
  Switch,
  Textarea,
} from "@ctps/ui/primitives";

import { AdminShell } from "./admin-shell";

const records = [
  { name: "Example Request A", type: "Interface sample", status: "New" },
  { name: "Example Request B", type: "Interface sample", status: "In review" },
  { name: "Draft Article", type: "Content sample", status: "Draft" },
  { name: "Published Article", type: "Content sample", status: "Published" },
] as const;

export function AdminDesignSystem() {
  return (
    <AdminShell pageTitle="Admin component gallery">
      <Alert title="Security boundary" tone="warning">
        This preview is intentionally unprotected. Navigation labels and states are visual
        demonstrations only; they do not fetch data or enforce permissions.
      </Alert>
      <section aria-labelledby="summary-title" className="mt-6">
        <h2 className="text-lg font-semibold" id="summary-title">
          Neutral summary cards
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {["Pending examples", "Draft examples", "Published examples", "System states"].map(
            (label, index) => (
              <Card key={label}>
                <CardHeader>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <CardTitle>{index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Demonstration value only</p>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </section>
      <section
        aria-labelledby="table-title"
        className="mt-8 rounded-lg border border-border bg-card"
      >
        <div className="flex flex-col gap-4 border-b border-border p-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold" id="table-title">
              Data-table foundation
            </h2>
            <p className="text-sm text-muted-foreground">
              Semantic desktop table with an overflow strategy.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldGroup>
              <Label htmlFor="record-search">Search examples</Label>
              <Input id="record-search" placeholder="Search neutral records" type="search" />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="record-filter">Filter status</Label>
              <Select id="record-filter">
                <option>All statuses</option>
                <option>Draft</option>
                <option>Published</option>
              </Select>
            </FieldGroup>
          </div>
        </div>
        <div className="admin-table-wrap" tabIndex={0}>
          <table className="admin-table">
            <caption className="sr-only">Neutral records demonstrating admin table styles</caption>
            <thead>
              <tr>
                <th scope="col">Example record</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.name}>
                  <th className="font-semibold" scope="row">
                    {record.name}
                  </th>
                  <td>{record.type}</td>
                  <td>
                    <Badge
                      tone={
                        record.status === "Published"
                          ? "success"
                          : record.status === "New"
                            ? "info"
                            : "neutral"
                      }
                    >
                      {record.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      aria-label={`Open actions for ${record.name}`}
                      size="sm"
                      variant="ghost"
                    >
                      Actions
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border p-4">
          <Pagination />
        </div>
      </section>
      <section aria-labelledby="mobile-table-title" className="mt-8">
        <h2 className="text-lg font-semibold" id="mobile-table-title">
          Responsive record alternative
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {records.map((record) => (
            <Card key={record.name}>
              <CardHeader>
                <CardTitle>{record.name}</CardTitle>
                <Badge>{record.status}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{record.type}</p>
                <Button className="mt-3 w-full" variant="outline">
                  View example
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section aria-labelledby="form-title" className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle id="form-title">Admin form layout</CardTitle>
            <p className="text-sm text-muted-foreground">
              Dense but readable field grouping with explicit descriptions and errors.
            </p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <FieldGroup>
                <Label htmlFor="example-title">Example title</Label>
                <Input aria-describedby="example-title-help" id="example-title" />
                <FormDescription id="example-title-help">
                  Neutral content used only to review spacing.
                </FormDescription>
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="example-state">Example state</Label>
                <Select id="example-state">
                  <option>Draft</option>
                  <option>Published</option>
                </Select>
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="example-description">Example description</Label>
                <Textarea id="example-description" />
              </FieldGroup>
              <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-border p-3">
                <span>
                  <span className="block text-sm font-semibold">Active demonstration</span>
                  <span className="block text-xs text-muted-foreground">No data is persisted.</span>
                </span>
                <Switch />
              </label>
              <FormError>Validation example: provide a descriptive title.</FormError>
              <Inline>
                <Button>Save demonstration</Button>
                <Button variant="outline">Cancel</Button>
              </Inline>
            </form>
          </CardContent>
        </Card>
        <div className="grid content-start gap-4">
          <LoadingState
            description="Stable rows and regions should reserve space."
            title="Loading state"
          />
          <EmptyState
            description="No neutral records are available in this view."
            title="Empty state"
          />
          <ErrorState
            description="Try the demonstration again. No stack trace is exposed."
            title="Validation error state"
          />
        </div>
      </section>
      <section aria-labelledby="feedback-title" className="mt-8">
        <h2 className="text-lg font-semibold" id="feedback-title">
          Overlays and operational feedback
        </h2>
        <Inline className="mt-3">
          <Dialog
            description="Native focus management, Escape behavior, and labeled structure."
            title="Edit demonstration"
            triggerLabel="Open dialog"
          >
            <p className="text-sm text-muted-foreground">No record is loaded or changed.</p>
          </Dialog>
          <AlertDialog />
          <Drawer title="Detail drawer">
            <p className="text-sm text-muted-foreground">
              A future detail panel can use this responsive foundation.
            </p>
          </Drawer>
          <ToastDemo />
        </Inline>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Alert title="Permission denied pattern" tone="danger">
            Access is unavailable. This demonstration does not inspect or reveal any resource.
          </Alert>
          <Alert title="Session expired pattern" tone="warning">
            Reauthentication will be implemented in Phase 3. Unsaved-input behavior remains
            deferred.
          </Alert>
          <Alert title="Save-success pattern" tone="success">
            The example was presented successfully; no data was changed.
          </Alert>
          <Alert title="Validation-error pattern" tone="danger">
            Review the named fields and keep entered values available.
          </Alert>
        </div>
      </section>
    </AdminShell>
  );
}
