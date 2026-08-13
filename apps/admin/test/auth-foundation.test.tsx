// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminShell } from "../src/components/admin-shell";
import { LoginForm } from "../src/components/auth-forms";
import { Forbidden } from "../src/components/forbidden";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace, refresh: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Phase 3 admin security UI", () => {
  it("submits credentials only to the same-origin BFF and follows mandatory password change", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { mustChangePassword: true } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<LoginForm next="//hostile.example" />);
    await user.type(screen.getByLabelText("Email"), "staff@example.com");
    await user.type(screen.getByLabelText("Password"), "a secure password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
    expect(replace).toHaveBeenCalledWith("/change-password");
    vi.unstubAllGlobals();
  });
  it("shows a generic failure and does not add registration or recovery links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unable to sign in with those credentials." }),
      }),
    );
    const user = userEvent.setup();
    render(<LoginForm next={null} />);
    await user.type(screen.getByLabelText("Email"), "unknown@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Unable to sign in");
    expect(screen.queryByText(/sign up|forgot password/i)).toBeNull();
    vi.unstubAllGlobals();
  });
  it("renders only the permission-filtered navigation supplied by the protected server layout", () => {
    render(
      <AdminShell
        identity={{ displayName: "Limited Author", email: "author@example.com" }}
        navigationItems={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/account", label: "Account & sessions" },
        ]}
        pageTitle="Administration"
      >
        <p>Protected</p>
      </AdminShell>,
    );
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.queryByText("Users")).toBeNull();
    expect(screen.queryByText("Audit logs")).toBeNull();
  });
  it("renders a non-disclosing forbidden state", () => {
    render(<Forbidden />);
    expect(screen.getByText("Permission required")).not.toBeNull();
    expect(screen.getByText(/does not have permission/)).not.toBeNull();
  });
});
