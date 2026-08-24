// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ToastProvider, useToast } from "../src/toast";

function Trigger() {
  const { toast } = useToast();
  return (
    <button
      onClick={() =>
        toast({
          title: "Project published",
          description: "The project is public.",
          tone: "success",
        })
      }
      type="button"
    >
      Notify
    </button>
  );
}

afterEach(cleanup);

describe("toast provider", () => {
  it("announces and dismisses a semantic notification", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Notify" }));
    expect(screen.getByRole("status").textContent).toContain("Project published");
    await user.click(
      screen.getByRole("button", { name: "Dismiss Project published notification" }),
    );
    expect(screen.queryByText("Project published")).toBeNull();
  });
});
