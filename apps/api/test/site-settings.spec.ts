import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { MarketingService } from "../src/marketing/marketing.service";

const actorUserId = crypto.randomUUID();

function serviceWith(availableMediaIds: string[]) {
  const upsert = vi.fn(async ({ data }: { data?: unknown }) => ({
    id: "settings",
    value: data ?? {},
  }));
  const database = {
    client: {
      publicMediaAsset: {
        findMany: vi.fn(async () => availableMediaIds.map((id) => ({ id }))),
      },
      siteSetting: {
        findUnique: vi.fn(async () => ({ value: { brandTagline: "Existing tagline" } })),
        upsert,
      },
    },
  };
  const audit = { record: vi.fn(async () => undefined) };
  return { service: new MarketingService(database as never, audit as never), upsert, audit };
}

describe("production Site Settings service", () => {
  it("merges optional business values and accepts only active managed media", async () => {
    const logoMediaId = crypto.randomUUID();
    const { service, upsert, audit } = serviceWith([logoMediaId]);
    await service.updateSettings(
      {
        businessDisplayName: "CTPS",
        logoMediaId,
        defaultSocialImageId: null,
        socialProfiles: {},
      },
      actorUserId,
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          value: expect.objectContaining({
            brandTagline: "Existing tagline",
            businessDisplayName: "CTPS",
            logoMediaId,
          }),
        }),
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "site_settings.updated" }),
    );
  });

  it("rejects an unmanaged or archived brand image", async () => {
    const { service } = serviceWith([]);
    await expect(
      service.updateSettings({ logoMediaId: crypto.randomUUID() }, actorUserId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
