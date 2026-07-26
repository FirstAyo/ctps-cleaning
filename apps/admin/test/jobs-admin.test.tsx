// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JobCreateForm } from "../src/components/job-create-form";
import { JobMediaUploader } from "../src/components/job-inline-controls";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
beforeEach(() => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:job-preview");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("Phase 9 Admin workflows", () => {
  it("offers quote conversion and staff creation without public booking or payment fields", () => {
    render(
      <JobCreateForm
        canCreateInternal
        eligibleQuotes={[
          {
            id: "10000000-0000-4000-8000-000000000001",
            reference: "CTPS-2026-7K3M9Q",
            customerName: "Test Customer",
            status: "ACCEPTED",
          },
        ]}
      />,
    );
    expect(screen.getByLabelText("Eligible quote")).not.toBeNull();
    expect(screen.getByText("Staff-created job")).not.toBeNull();
    expect(screen.queryByLabelText(/payment|card|customer password|public booking/i)).toBeNull();
  });
  it("shows multiple private local previews and removal before upload", async () => {
    const user = userEvent.setup();
    render(<JobMediaUploader canUpload jobId="10000000-0000-4000-8000-000000000001" />);
    const picker = screen.getByLabelText("Private job photos");
    await user.upload(picker, [
      new File(["a"], "before.jpg", { type: "image/jpeg" }),
      new File(["b"], "after.png", { type: "image/png" }),
    ]);
    expect(screen.getByText("before.jpg")).not.toBeNull();
    expect(screen.getByText("after.png")).not.toBeNull();
    await user.click(screen.getAllByRole("button", { name: "Remove before upload" })[0]!);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
