import { describe, expect, it } from "vitest";

import { generalInquirySubmissionSchema } from "../src";

const valid = {
  idempotencyKey: "00000000-0000-4000-8000-000000000013",
  honeypot: "",
  name: "Alex Customer",
  email: "alex@example.com",
  message: "I have a question about exterior cleaning.",
};

describe("general inquiry validation", () => {
  it("accepts a valid minimal inquiry and normalizes email", () => {
    expect(
      generalInquirySubmissionSchema.parse({ ...valid, email: " ALEX@Example.COM " }).email,
    ).toBe("alex@example.com");
  });

  it("accepts optional phone and approved service interest", () => {
    expect(
      generalInquirySubmissionSchema.parse({
        ...valid,
        phone: "+1 (604) 555-0100",
        serviceKey: "window-cleaning",
      }).serviceKey,
    ).toBe("window-cleaning");
  });

  it.each([
    ["name", { ...valid, name: "" }],
    ["email", { ...valid, email: "invalid" }],
    ["message", { ...valid, message: "short" }],
    ["honeypot", { ...valid, honeypot: "spam.example" }],
  ])("rejects invalid %s input", (_field, input) => {
    expect(generalInquirySubmissionSchema.safeParse(input).success).toBe(false);
  });

  it("rejects client-supplied fields and unsupported service keys", () => {
    expect(generalInquirySubmissionSchema.safeParse({ ...valid, id: "chosen" }).success).toBe(
      false,
    );
    expect(
      generalInquirySubmissionSchema.safeParse({ ...valid, serviceKey: "unsupported" }).success,
    ).toBe(false);
  });
});
