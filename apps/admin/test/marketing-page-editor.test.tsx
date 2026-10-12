// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ctps/ui/toast";
import { MarketingPageEditor } from "../src/components/marketing-page-editor";
import {
  FocalPointEditor,
  MarketingImageField,
  MediaUploadQueue,
} from "../src/components/marketing-media-picker";
import type { MarketingPage, PublicMediaItem } from "../src/lib/marketing-types";

const renderWithToast = (ui: React.ReactNode) => render(<ToastProvider>{ui}</ToastProvider>);

const page: MarketingPage = {
  id: crypto.randomUUID(),
  pageKey: "HOME",
  slug: "/",
  title: "Homepage",
  navigationLabel: "Home",
  pageType: "LANDING",
  status: "PUBLISHED",
  version: 1,
  draftContent: {
    sections: [
      {
        id: "hero",
        type: "HERO_SLIDER",
        enabled: true,
        eyebrow: "Property care",
        title: "A precise plan",
        body: "Clear property-care context.",
        primaryCta: { label: "Request a Quote", href: "/request-a-quote" },
        mediaIds: [],
        overlay: "BALANCED",
        autoplay: true,
        intervalMs: 7000,
      },
    ],
  },
  publishedContent: null,
  seoTitle: null,
  seoDescription: null,
  ogTitle: null,
  ogDescription: null,
  socialImageId: null,
  updatedAt: new Date().toISOString(),
  publishedAt: null,
  revisions: [],
  media: [],
};
const media = (id = crypto.randomUUID(), title = "Property exterior"): PublicMediaItem => ({
  id,
  originalFilename: "property.jpg",
  title,
  altText: "Clean property exterior",
  caption: null,
  mimeType: "image/webp",
  sizeBytes: 145_000,
  width: 1800,
  height: 1200,
  focalPointX: 50,
  focalPointY: 50,
  status: "READY",
  createdAt: "2026-08-12T12:00:00.000Z",
  updatedAt: "2026-08-12T12:00:00.000Z",
  archivedAt: null,
  usageCount: 0,
  variants: {
    thumbnail: {
      path: `/media/marketing/${id}/thumbnail`,
      width: 360,
      height: 240,
      sizeBytes: 12_000,
      mimeType: "image/webp",
    },
  },
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("marketing page editor", () => {
  it("presents controlled Hero, Draft, Preview, Publish, and SEO controls", () => {
    renderWithToast(
      <MarketingPageEditor
        canMediaDelete
        canMediaUpdate
        canMediaUpload
        canPublish
        canSeo
        media={[]}
        page={page}
      />,
    );
    expect(screen.getByRole("button", { name: /save draft/i })).not.toBeNull();
    expect(screen.getByRole("button", { name: /publish/i })).not.toBeNull();
    expect(screen.getByRole("link", { name: /preview/i }).getAttribute("target")).toBe("_blank");
    expect(screen.getByLabelText("Overlay")).not.toBeNull();
    expect(screen.getByLabelText("SEO title")).not.toBeNull();
    expect(screen.getByRole("button", { name: /manage up to 4 images/i })).not.toBeNull();
    expect(screen.getByRole("button", { name: /upload new image/i })).not.toBeNull();
  });
  it("saves the current editor state before publishing the returned Draft version", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...page, version: 2 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...page, version: 3, status: "PUBLISHED" }),
      });
    vi.stubGlobal("fetch", fetchMock);
    renderWithToast(
      <MarketingPageEditor
        canMediaDelete
        canMediaUpdate
        canMediaUpload
        canPublish
        canSeo
        media={[]}
        page={page}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /publish/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/admin/pages/HOME");
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ method: "PATCH" }));
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/admin/pages/HOME/publish");
    expect(fetchMock.mock.calls[1]?.[1]?.body).toContain('"version":2');
  });
  it("exposes human-readable section entries, contextual alt text, media reuse, and Published project selection", () => {
    const servicePage: MarketingPage = {
      ...page,
      pageKey: "SERVICE_WINDOW_CLEANING",
      title: "Window Cleaning",
      draftContent: {
        sections: [
          {
            id: "services",
            type: "SERVICE_SHOWCASE",
            enabled: true,
            title: "Service showcase",
            body: "Editorial service copy",
            mediaIds: [],
            projectIds: [],
            postIds: [],
            items: [
              {
                key: "windows",
                title: "Windows",
                body: "Careful window care",
                href: "/services/window-cleaning",
              },
            ],
          },
          {
            id: "proof",
            type: "FEATURED_PROJECT",
            enabled: true,
            title: "Selected work",
            mediaIds: [],
            projectIds: [],
            postIds: [],
            items: [],
          },
        ],
      },
    };
    renderWithToast(
      <MarketingPageEditor
        canMediaDelete
        canMediaUpdate
        canMediaUpload
        canPublish
        canSeo
        media={[]}
        page={servicePage}
        projects={[
          {
            id: crypto.randomUUID(),
            title: "Published window project",
            serviceKey: "window-cleaning",
            serviceAreaKey: "vancouver",
          },
        ]}
      />,
    );
    expect(screen.getByLabelText("Contextual image alt text")).not.toBeNull();
    expect(screen.getByText("Published window project")).not.toBeNull();
    expect(screen.getByRole("button", { name: /choose from media library/i })).not.toBeNull();
    expect(screen.queryByText(/raw json/i)).toBeNull();
  });
});

describe("reusable marketing media controls", () => {
  it("chooses an existing asset, reorders selections, and removes a section reference", () => {
    const first = media(crypto.randomUUID(), "First exterior");
    const second = media(crypto.randomUUID(), "Second exterior");
    const onChange = vi.fn();
    renderWithToast(
      <MarketingImageField
        canDelete
        canUpdate
        canUpload
        guidance="Choose the approved images."
        label="Hero images"
        maxSelections={4}
        media={[first, second]}
        onChange={onChange}
        selectedIds={[first.id, second.id]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /move image 2 earlier/i }));
    expect(onChange).toHaveBeenCalledWith([second.id, first.id]);
    fireEvent.click(screen.getByRole("button", { name: /remove image 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /remove from draft/i }));
    expect(onChange).toHaveBeenCalledWith([second.id]);
  });

  it("opens the paginated picker and selects existing media", async () => {
    const item = media();
    const showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    const close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    });
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: { configurable: true, value: showModal },
      close: { configurable: true, value: close },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [item], page: 1, pageSize: 24, total: 1, totalPages: 1 }),
      }),
    );
    const onChange = vi.fn();
    renderWithToast(
      <MarketingImageField
        canDelete
        canUpdate
        canUpload
        guidance="Choose an image."
        label="Final CTA image"
        maxSelections={1}
        media={[item]}
        onChange={onChange}
        selectedIds={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /choose from media library/i }));
    expect(showModal).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /property exterior/i })).not.toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: /property exterior/i }));
    fireEvent.click(screen.getByRole("button", { name: /use this image/i }));
    expect(onChange).toHaveBeenCalledWith([item.id]);
    expect(close).toHaveBeenCalled();
  });

  it("selects multiple ordered images for the Hero carousel", async () => {
    const first = media(crypto.randomUUID(), "First Hero");
    const second = media(crypto.randomUUID(), "Second Hero");
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: {
        configurable: true,
        value: function (this: HTMLDialogElement) {
          this.setAttribute("open", "");
        },
      },
      close: {
        configurable: true,
        value: function (this: HTMLDialogElement) {
          this.removeAttribute("open");
        },
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [first, second],
          page: 1,
          pageSize: 24,
          total: 2,
          totalPages: 1,
        }),
      }),
    );
    const onChange = vi.fn();
    renderWithToast(
      <MarketingImageField
        canDelete
        canUpdate
        canUpload
        guidance="Choose Hero carousel images."
        label="Hero carousel images"
        maxSelections={4}
        media={[first, second]}
        onChange={onChange}
        selectedIds={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /manage up to 4 images/i }));
    await waitFor(() => expect(screen.getByText("First Hero")).not.toBeNull());
    fireEvent.click(screen.getByRole("button", { name: /first hero/i }));
    fireEvent.click(screen.getByRole("button", { name: /second hero/i }));
    expect(screen.getByText("2 of 4 selected")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /use selected images/i }));
    expect(onChange).toHaveBeenCalledWith([first.id, second.id]);
  });

  it("allows an image into a Draft while preserving the publish-time alt-text block", async () => {
    const item = { ...media(), altText: "" };
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: {
        configurable: true,
        value: function (this: HTMLDialogElement) {
          this.setAttribute("open", "");
        },
      },
      close: {
        configurable: true,
        value: function (this: HTMLDialogElement) {
          this.removeAttribute("open");
        },
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [item], page: 1, pageSize: 24, total: 1, totalPages: 1 }),
      }),
    );
    const onChange = vi.fn();
    renderWithToast(
      <MarketingImageField
        canDelete
        canUpdate
        canUpload
        guidance="Choose a service image."
        label="Service image"
        maxSelections={1}
        media={[item]}
        onChange={onChange}
        selectedIds={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /choose from media library/i }));
    const mediaCardName = new RegExp(item.title, "i");
    await waitFor(() => expect(screen.getByRole("button", { name: mediaCardName })).not.toBeNull());
    fireEvent.click(screen.getByRole("button", { name: mediaCardName }));
    expect(
      screen.getByText(/publishing remains blocked until descriptive alt text is saved/i),
    ).not.toBeNull();
    const useButton = screen.getByRole("button", { name: /use this image/i });
    expect((useButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(useButton);
    expect(onChange).toHaveBeenCalledWith([item.id]);
  });

  it("uploads multiple files with per-file success and retryable failure states", async () => {
    const created = media();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [created],
          failures: [{ filename: "bad.jpg", message: "The image could not be decoded safely." }],
        }),
      }),
    );
    const onUploaded = vi.fn();
    const { container } = renderWithToast(<MediaUploadQueue canUpload onUploaded={onUploaded} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const good = new File(["good"], "good.jpg", { type: "image/jpeg" });
    const bad = new File(["bad"], "bad.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [good, bad] } });
    fireEvent.click(screen.getByRole("button", { name: /upload and process/i }));
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith([created]));
    expect(screen.getByText("Complete", { exact: false })).not.toBeNull();
    expect(screen.getByText(/could not be decoded safely/i)).not.toBeNull();
    expect(screen.getByRole("button", { name: /upload and process/i })).not.toBeNull();
  });

  it("saves accessible focal-point controls and media-level alt text", async () => {
    const item = media();
    const updated = { ...item, focalPointX: 35, focalPointY: 65, altText: "Window cleaning" };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => updated });
    vi.stubGlobal("fetch", fetchMock);
    const onChange = vi.fn();
    renderWithToast(<FocalPointEditor canUpdate item={item} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/horizontal focal point/i), { target: { value: "35" } });
    fireEvent.change(screen.getByLabelText(/vertical focal point/i), { target: { value: "65" } });
    fireEvent.change(screen.getByLabelText(/default alt text/i), {
      target: { value: "Window cleaning" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save details/i }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(updated));
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/admin/media-library/${item.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"focalPointX":35'),
      }),
    );
  });
});
