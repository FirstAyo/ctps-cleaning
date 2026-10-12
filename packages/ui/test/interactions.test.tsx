// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Dialog,
  ConfirmationDialog,
  ImageComparison,
  ThemeToggle,
  getNextComparisonValue,
  resolveTheme,
  themeStorageKey,
} from "../src";

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.className = "";
  vi.stubGlobal(
    "matchMedia",
    vi
      .fn()
      .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("theme behavior", () => {
  it("resolves system preference deterministically", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("starts with an icon-only system preference, then toggles and persists light or dark", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const toggle = screen.getByRole("button", { name: /Theme: system/i });
    expect(toggle.textContent).toBe("");
    await user.click(toggle);
    expect(window.localStorage.getItem(themeStorageKey)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    await user.click(screen.getByRole("button", { name: /Theme: dark/i }));
    expect(window.localStorage.getItem(themeStorageKey)).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

describe("image comparison", () => {
  it("clamps keyboard movement and supports accelerated keys", () => {
    expect(getNextComparisonValue(98, "ArrowRight")).toBe(100);
    expect(getNextComparisonValue(4, "ArrowLeft", true)).toBe(0);
    expect(getNextComparisonValue(50, "Home")).toBe(0);
    expect(getNextComparisonValue(50, "End")).toBe(100);
  });

  it("responds to pointer-range input and arrow keys", async () => {
    const user = userEvent.setup();
    render(<ImageComparison initialValue={40} />);
    const range = screen.getByRole("slider", { name: /before and after comparison/i });
    fireEvent.change(range, { target: { value: "72" } });
    expect(screen.getByText("72% before")).not.toBeNull();
    range.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("74% before")).not.toBeNull();
  });
});

describe("dialog foundation", () => {
  it("opens through a labeled trigger using the native modal API", async () => {
    const showModal = vi.fn();
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value: showModal,
    });
    const user = userEvent.setup();
    render(
      <Dialog
        description="Focus-managed example"
        title="Accessible dialog"
        triggerLabel="Open dialog"
      >
        Body
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(showModal).toHaveBeenCalledOnce();
    expect(document.querySelector("dialog")?.getAttribute("aria-labelledby")).toBeTruthy();
  });

  it("uses an accessible in-app confirmation instead of a browser alert", async () => {
    const showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value: showModal,
    });
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmationDialog
        confirmLabel="Delete image"
        description="This cannot be undone."
        destructive
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        open
        title="Delete public image?"
      />,
    );
    expect(showModal).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog", { name: "Delete public image?" })).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Delete image" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
