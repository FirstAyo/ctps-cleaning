// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@ctps/ui/toast";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { GeneralInquiryActions } from "../src/components/general-inquiry-actions";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("general inquiry Admin actions", () => {
  it("shows only actions granted by server-derived permissions", () => {
    render(
      <ToastProvider>
        <GeneralInquiryActions
          archived={false}
          canArchive={false}
          canUpdate={false}
          id="inquiry"
          status="NEW"
        />
      </ToastProvider>,
    );
    expect(screen.queryByRole("button", { name: "Mark as read" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
  });

  it("marks an inquiry read and archives through the protected BFF", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal("fetch", fetch);
    render(
      <ToastProvider>
        <GeneralInquiryActions
          archived={false}
          canArchive
          canUpdate
          id="00000000-0000-4000-8000-000000000013"
          status="NEW"
        />
      </ToastProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Mark as read" }));
    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/admin/general-inquiries/00000000-0000-4000-8000-000000000013/read",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/admin/general-inquiries/00000000-0000-4000-8000-000000000013/archive",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
