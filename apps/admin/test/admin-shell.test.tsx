// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminShell } from "../src/components/admin-shell";

beforeEach(() => {
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

describe("admin shell demonstration", () => {
  it("collapses the desktop sidebar with an accessible reversible control", async () => {
    const user = userEvent.setup();
    render(
      <AdminShell pageTitle="Test gallery">
        <p>Content</p>
      </AdminShell>,
    );
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByRole("button", { name: "Expand sidebar" })).not.toBeNull();
    expect(screen.getByLabelText("Dashboard")).not.toBeNull();
  });

  it("opens the mobile drawer and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(
      <AdminShell pageTitle="Test gallery">
        <p>Content</p>
      </AdminShell>,
    );
    const trigger = screen.getByRole("button", { name: "Open admin navigation" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Mobile admin navigation" })).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Mobile admin navigation" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("renders stable unique navigation links without React key warnings", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <AdminShell
        navigationItems={[
          { href: "/blog/posts", label: "Blog Posts" },
          { href: "/blog/categories", label: "Blog Categories" },
          { href: "/blog/tags", label: "Blog Tags" },
          { href: "/blog/authors", label: "Blog Authors" },
        ]}
        pageTitle="Blog"
      >
        <p>Content</p>
      </AdminShell>,
    );
    expect(screen.getByRole("link", { name: "Blog Authors" })).not.toBeNull();
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("unique key");
  });
});
