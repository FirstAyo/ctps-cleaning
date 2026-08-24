// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BeforeAfterEditor } from "../src/components/before-after-editor";
import { ToastProvider } from "@ctps/ui/toast";

const { replace, refresh } = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

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
    <ToastProvider>
      <BeforeAfterEditor
        canArchive={false}
        canDelete={false}
        canDeleteMedia
        canPublish={false}
        canUpdateMedia
        canUpload
        {...overrides}
      />
    </ToastProvider>
  );
}

describe("before-and-after administration", () => {
  it("renders the create form and a permission-denied upload state", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(editor({ canUpload: false }));
    expect(screen.getByRole("heading", { name: "New Project" })).not.toBeNull();
    expect(screen.getByText("You do not have upload permission.")).not.toBeNull();
    expect(screen.queryByLabelText("Select one or more images")).toBeNull();
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("cannot be a descendant");
  });

  it("previews multiple local files, reorders them, and removes one before upload", async () => {
    const user = userEvent.setup();
    render(editor());
    const input = screen.getByLabelText("Add supporting gallery photos");
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
      await screen.findAllByText(
        "This project changed after it was opened. Refresh before saving again.",
      ),
    ).toHaveLength(2);
    await waitFor(() => expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(2));
  });

  it("captures the real form before awaiting an upload and creates exactly one draft", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: "00000000-0000-4000-8000-000000000001",
                originalFilename: "before.jpg",
                altText: "",
                caption: null,
                width: 1200,
                height: 800,
                visibility: "PRIVATE",
              },
            ],
          }),
          { status: 201, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "00000000-0000-4000-8000-000000000010" }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(editor());
    await user.type(screen.getByLabelText("Title"), "Downtown Vancouver Window Cleaning");
    await user.upload(
      screen.getByLabelText("Add supporting gallery photos"),
      new File(["before"], "before.jpg", { type: "image/jpeg" }),
    );
    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      fetchMock.mock.calls.filter(([path]) => path === "/api/admin/before-after-projects"),
    ).toHaveLength(1);
    const body = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      title: "Downtown Vancouver Window Cleaning",
      slug: "downtown-vancouver-window-cleaning",
      summary: "",
      intent: "SAVE_DRAFT",
    });
  });

  it("keeps toolbar, slug regenerate, and media actions as non-submit controls", async () => {
    render(editor());
    expect(screen.getByRole("button", { name: "Bold" }).getAttribute("type")).toBe("button");
    expect(
      screen.getByRole("button", { name: "Regenerate slug from title" }).getAttribute("type"),
    ).toBe("button");
    expect(screen.getByLabelText("Add supporting gallery photos").getAttribute("type")).toBe(
      "file",
    );
  });

  it("shows one toast and both inline errors when direct publication lacks both photos", async () => {
    const user = userEvent.setup();
    render(editor({ canPublish: true }));
    await user.type(screen.getByLabelText("Title"), "Burnaby Exterior Window Cleaning");
    await user.click(screen.getByRole("button", { name: "Publish Now" }));
    expect(await screen.findByText("Project isn't ready to publish")).not.toBeNull();
    expect(screen.getByText("Add at least one Before photo before publishing.")).not.toBeNull();
    expect(screen.getByText("Add at least one After photo before publishing.")).not.toBeNull();
    expect(
      screen
        .getAllByRole("alert")
        .filter((node) => node.textContent?.includes("Project isn't ready")),
    ).toHaveLength(1);
  });

  it.each([
    { selected: "Before", missing: "After" },
    { selected: "After", missing: "Before" },
  ])(
    "keeps $missing publication validation inline when only $selected is selected",
    async ({ selected, missing }) => {
      const user = userEvent.setup();
      render(editor({ canPublish: true }));
      await user.type(screen.getByLabelText("Title"), `${selected} only project`);
      await user.upload(
        screen.getByLabelText(`Upload ${selected} photo`),
        new File([selected], `${selected.toLowerCase()}.jpg`, { type: "image/jpeg" }),
      );
      await user.click(screen.getByRole("button", { name: "Publish Now" }));
      expect(
        await screen.findByText(`Add at least one ${missing} photo before publishing.`),
      ).not.toBeNull();
      expect(
        screen.getByText(`${missing === "After" ? "An" : "A"} ${missing} photo is required.`),
      ).not.toBeNull();
    },
  );

  it("keeps selected media and shows one upload-failure toast", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "The Before photo could not be processed." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const user = userEvent.setup();
    render(editor());
    await user.type(screen.getByLabelText("Title"), "Upload failure project");
    await user.upload(
      screen.getByLabelText("Upload Before photo"),
      new File(["before"], "before.jpg", { type: "image/jpeg" }),
    );
    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    expect(await screen.findByText("Photo upload failed")).not.toBeNull();
    expect(screen.getByText("before.jpg")).not.toBeNull();
    expect(document.querySelectorAll(".ctps-toast")).toHaveLength(1);
  });

  it("sends explicit Publish intent and shows a persistent success toast", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: "00000000-0000-4000-8000-000000000001",
                originalFilename: "before.jpg",
                altText: "",
                caption: null,
                width: 1200,
                height: 800,
                visibility: "PRIVATE",
              },
            ],
          }),
          { status: 201, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: "00000000-0000-4000-8000-000000000002",
                originalFilename: "after.jpg",
                altText: "",
                caption: null,
                width: 1200,
                height: 800,
                visibility: "PRIVATE",
              },
            ],
          }),
          { status: 201, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "00000000-0000-4000-8000-000000000010",
            slug: "burnaby-exterior-window-cleaning",
            status: "PUBLISHED",
          }),
          { status: 201, headers: { "content-type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(editor({ canPublish: true }));
    await user.type(screen.getByLabelText("Title"), "Burnaby Exterior Window Cleaning");
    await user.upload(
      screen.getByLabelText("Upload Before photo"),
      new File(["before"], "before.jpg", { type: "image/jpeg" }),
    );
    await user.upload(
      screen.getByLabelText("Upload After photo"),
      new File(["after"], "after.jpg", { type: "image/jpeg" }),
    );
    await user.click(screen.getByRole("button", { name: "Publish Now" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const body = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      intent: "PUBLISH",
      primaryBeforeMediaId: "00000000-0000-4000-8000-000000000001",
      primaryAfterMediaId: "00000000-0000-4000-8000-000000000002",
    });
    expect(await screen.findByText("Project published")).not.toBeNull();
    expect(replace).toHaveBeenCalledWith("/before-after/00000000-0000-4000-8000-000000000010");
  });
});
