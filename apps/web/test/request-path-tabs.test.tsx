// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@ctps/ui/toast";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RequestPathTabs } from "../src/components/request-path-tabs";

beforeEach(() => {
  vi.stubGlobal("crypto", {
    randomUUID: vi.fn().mockReturnValue("00000000-0000-4000-8000-000000000014"),
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        draftToken: "draft-token",
        services: [],
        serviceAreas: [],
      }),
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("request path tabs", () => {
  it("defaults to the message form and preserves input while switching paths", async () => {
    render(
      <ToastProvider>
        <RequestPathTabs />
      </ToastProvider>,
    );
    const user = userEvent.setup();
    const messageTab = screen.getByRole("tab", { name: /send us a message/i });
    const quoteTab = screen.getByRole("tab", { name: /request a quote/i });
    const messagePanel = screen.getByRole("tabpanel", { name: /send us a message/i });
    const quotePanel = document.querySelector<HTMLElement>("#request-quote-panel")!;

    expect(messageTab.getAttribute("aria-selected")).toBe("true");
    expect(messagePanel.hidden).toBe(false);
    expect(quotePanel.hidden).toBe(true);

    await user.type(screen.getByLabelText("Name"), "Alex Customer");
    await user.click(quoteTab);
    expect(quoteTab.getAttribute("aria-selected")).toBe("true");
    expect(quotePanel.hidden).toBe(false);

    await user.click(messageTab);
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Alex Customer");
  });

  it("supports arrow-key tab selection", async () => {
    render(
      <ToastProvider>
        <RequestPathTabs />
      </ToastProvider>,
    );
    const user = userEvent.setup();
    const messageTab = screen.getByRole("tab", { name: /send us a message/i });
    const quoteTab = screen.getByRole("tab", { name: /request a quote/i });

    messageTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(quoteTab.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(quoteTab);
  });
});
