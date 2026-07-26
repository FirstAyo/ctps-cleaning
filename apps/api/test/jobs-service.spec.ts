import { PERMISSION_KEYS } from "@ctps/permissions";
import { describe, expect, it, vi } from "vitest";
import { JobsService } from "../src/jobs/jobs.service";

describe("jobs service safeguards", () => {
  it("retries a cryptographic reference collision without accepting a client reference", async () => {
    const created = {
      id: "10000000-0000-4000-8000-000000000001",
      referenceNumber: "JOB-2026-ABCDEFGH2",
    };
    const create = vi.fn().mockRejectedValueOnce({ code: "P2002" }).mockResolvedValueOnce(created);
    const database = {
      client: {
        serviceJob: {
          create,
          findUnique: vi.fn().mockResolvedValue({
            ...created,
            assignments: [],
            services: [],
            checklistItems: [],
            notes: [],
            incidents: [],
            media: [],
            statusHistory: [],
            scheduleHistory: [],
            activities: [],
            emailMessages: [],
            quoteRequest: null,
            coordinator: null,
          }),
        },
        serviceJobActivity: { create: vi.fn() },
      },
    };
    const audit = { record: vi.fn() };
    const references = {
      generate: vi
        .fn()
        .mockReturnValueOnce("JOB-2026-ABCDEFGH3")
        .mockReturnValueOnce(created.referenceNumber),
    };
    const service = new JobsService(database as never, audit as never, references as never);
    const input = {
      customerType: "RESIDENTIAL" as const,
      customerName: "Runtime Customer",
      customerEmail: "runtime@example.invalid",
      customerPhone: "6045550100",
      companyName: null,
      propertyAddressLine1: "100 Runtime Street",
      propertyAddressLine2: null,
      city: "Vancouver",
      serviceAreaKey: "vancouver" as const,
      province: "British Columbia" as const,
      postalCode: "V5K0A1",
      propertyType: "Residential property",
      services: [{ serviceKey: "window-cleaning" as const, scopeSummary: "Exterior windows" }],
      serviceScopeSummary: "Exterior window cleaning",
      accessNotes: null,
      customerSchedulingNotes: null,
      internalOperationalNotes: null,
    };
    await service.createInternal(input, {
      userId: "20000000-0000-4000-8000-000000000001",
      permissions: [PERMISSION_KEYS.JOBS_CREATE_INTERNAL, PERMISSION_KEYS.JOBS_READ],
    } as never);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0]![0].data).not.toHaveProperty("id", input);
    expect(references.generate).toHaveBeenCalledTimes(2);
  });
});
