// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BeforeAfterEditor } from "../src/components/before-after-editor";

beforeEach(() => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  class PreviewImage {
    naturalWidth = 1200;
    naturalHeight = 800;
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    set src(_value: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal("Image", PreviewImage);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function editor(overrides: Partial<React.ComponentProps<typeof BeforeAfterEditor>> = {}) {
  return (
    <BeforeAfterEditor
      canArchive={false}
      canDelete={false}
      canDeleteMedia
      canPublish={false}
      canUpdateMedia
      canUpload
      {...overrides}
    />
  );
}

describe("before-and-after administration", () => {
  it("renders the create form and a permission-denied upload state", () => {
    render(editor({ canUpload: false }));
    expect(screen.getByRole("heading", { name: "Create before-and-after project" })).not.toBeNull();
    expect(screen.getByText("You do not have upload permission.")).not.toBeNull();
    expect(screen.queryByLabelText("Select one or more images")).toBeNull();
  });

  it("previews multiple local files, reorders them, and removes one before upload", async () => {
    const user = userEvent.setup();
    render(editor());
    const input = screen.getByLabelText("Select one or more images");
    await user.upload(input, [
      new File(["before"], "before.jpg", { type: "image/jpeg" }),
      new File(["after"], "after.jpg", { type: "image/jpeg" }),
    ]);
    expect(await screen.findByText("before.jpg")).not.toBeNull();
    expect(screen.getByText("after.jpg")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Move before.jpg down" }));
    expect(screen.getByText(/Position 2/)).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Remove before.jpg" }));
    expect(screen.queryByText("before.jpg")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("warns about unsaved changes and presents API conflict feedback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "PROJECT_VERSION_CONFLICT",
            message: "This project changed after it was opened. Refresh before saving again.",
          }),
          { status: 409, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const { container } = render(editor());
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Project" } });
    const beforeUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
    fireEvent.submit(container.querySelector("form")!);
    expect(
      await screen.findByText(
        "This project changed after it was opened. Refresh before saving again.",
      ),
    ).not.toBeNull();
    await waitFor(() => expect(screen.getByRole("alert")).not.toBeNull());
  });
});
