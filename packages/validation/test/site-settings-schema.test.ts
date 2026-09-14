import { describe, expect, it } from "vitest";

import { siteSettingsUpdateSchema } from "../src";

describe("production Site Settings validation", () => {
  it("accepts optional managed brand media and verified HTTPS social profiles", () => {
    const logoMediaId = crypto.randomUUID();
    expect(
      siteSettingsUpdateSchema.parse({
        businessDisplayName: "CTPS",
        logoMediaId,
        defaultSocialImageId: null,
        announcementEnabled: false,
        socialProfiles: { instagram: "https://www.instagram.com/ctps" },
      }),
    ).toMatchObject({ businessDisplayName: "CTPS", logoMediaId, announcementEnabled: false });
  });

  it("rejects insecure social URLs and unknown business fields", () => {
    expect(() =>
      siteSettingsUpdateSchema.parse({ socialProfiles: { facebook: "http://example.com/ctps" } }),
    ).toThrow();
    expect(() => siteSettingsUpdateSchema.parse({ streetAddress: "Invented address" })).toThrow();
  });
});
