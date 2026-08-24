// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@ctps/ui/toast";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GeneralInquiryForm } from "../src/components/general-inquiry-form";

beforeEach(() => {
  vi.stubGlobal("crypto", {
    randomUUID: vi.fn().mockReturnValue("00000000-0000-4000-8000-000000000013"),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderForm() {
  render(
    <ToastProvider>
      <GeneralInquiryForm />
    </ToastProvider>,
  );
}

describe("general inquiry form", () => {
  it("shows inline validation for required name, email, and message", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByText("Enter your name.")).not.toBeNull();
    expect(screen.getByText("Enter a valid email address.")).not.toBeNull();
    expect(screen.getByText("Enter a message of at least 10 characters.")).not.toBeNull();
  });

  it("submits optional phone/service and presents a success state and toast", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    });
    vi.stubGlobal("fetch", fetch);
    renderForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Name"), "Alex Customer");
    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText(/Phone/), "+1 604 555 0100");
    await user.selectOptions(screen.getByLabelText(/Service interest/), "window-cleaning");
    await user.type(screen.getByLabelText("Message"), "Please tell me more about this service.");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(await screen.findByText("Message received.")).not.toBeNull();
    expect(screen.getByText("Message sent")).not.toBeNull();
    expect(JSON.parse(fetch.mock.calls[0]![1].body as string)).toEqual(
      expect.objectContaining({
        phone: "+1 604 555 0100",
        serviceKey: "window-cleaning",
      }),
    );
  });

  it("uses an error toast and retains the idempotency key for a retry", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: "Messages are temporarily unavailable." }),
    });
    vi.stubGlobal("fetch", fetch);
    renderForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Name"), "Alex Customer");
    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText("Message"), "Please tell me more about this service.");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("Message not sent")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const first = JSON.parse(fetch.mock.calls[0]![1].body as string);
    const second = JSON.parse(fetch.mock.calls[1]![1].body as string);
    expect(second.idempotencyKey).toBe(first.idempotencyKey);
  });
});
