// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SiteSettingsManager } from "../src/components/site-settings-manager";

afterEach(cleanup);

describe("production Site Settings workspace", () => {
  it("offers centralized optional business, announcement, and social fields", () => {
    render(
      <SiteSettingsManager
        canReadMedia
        canUpdateMedia
        canUploadMedia
        editable
        initialMedia={[]}
        initialSettings={{ businessDisplayName: "CTPS", socialProfiles: {} }}
      />,
    );
    expect(screen.getByLabelText("Business display name")).not.toBeNull();
    expect(screen.getByLabelText("Public contact email")).not.toBeNull();
    expect(screen.getByLabelText("Public contact phone")).not.toBeNull();
    expect(screen.getByLabelText("Announcement text")).not.toBeNull();
    expect(screen.getByLabelText("Instagram")).not.toBeNull();
    expect(screen.getAllByRole("button", { name: "Choose from Media Library" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Upload New Image/ })).toHaveLength(2);
  });

  it("does not expose media selection without Public Media access", () => {
    render(
      <SiteSettingsManager
        canReadMedia={false}
        canUpdateMedia={false}
        canUploadMedia={false}
        editable
        initialMedia={[]}
        initialSettings={{}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Choose from Media Library" })).toBeNull();
    expect(screen.getByText(/Public Media access is required/)).not.toBeNull();
  });
});
