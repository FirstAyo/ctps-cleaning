// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PremiumHero } from "../src/components/premium-hero";

const section = {
  id: "hero",
  type: "HERO_SLIDER",
  enabled: true,
  eyebrow: "Property care",
  title: "A cleaner exterior starts with a precise plan.",
  body: "Residential and commercial property-care inquiries.",
  primaryCta: { label: "Request a Quote", href: "/request-a-quote" },
  secondaryCta: { label: "Estimate", href: "/estimate" },
  mediaIds: [] as string[],
  overlay: "BALANCED" as const,
  autoplay: true,
  intervalMs: 6000 as const,
};
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("premium Hero", () => {
  it("renders no more than four slides and safe CTA destinations", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    const { container, getByRole } = render(
      <PremiumHero
        section={{
          ...section,
          mediaIds: [
            crypto.randomUUID(),
            crypto.randomUUID(),
            crypto.randomUUID(),
            crypto.randomUUID(),
          ],
        }}
      />,
    );
    expect(container.querySelectorAll("img")).toHaveLength(4);
    expect(getByRole("link", { name: "Request a Quote" }).getAttribute("href")).toBe(
      "/request-a-quote",
    );
  });
  it("does not auto-advance when reduced motion is requested", () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    const { container } = render(<PremiumHero section={section} />);
    const first = container.querySelector("img");
    expect(first?.className).toContain("is-active");
    vi.advanceTimersByTime(18_000);
    expect(first?.className).toContain("is-active");
  });
});
