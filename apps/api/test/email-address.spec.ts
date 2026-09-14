import { describe, expect, it } from "vitest";

import { emailFromAddress } from "../src/common/email-address";

describe("email sender identity", () => {
  it("formats an environment-managed sender name without changing the approved address", () => {
    expect(emailFromAddress("CTPS Operations", "hello@example.com")).toBe(
      '"CTPS Operations" <hello@example.com>',
    );
  });

  it("escapes display-name delimiters and never includes a line break", () => {
    expect(emailFromAddress('CTPS "Team"', "hello@example.com")).toBe(
      '"CTPS \\"Team\\"" <hello@example.com>',
    );
  });
});
