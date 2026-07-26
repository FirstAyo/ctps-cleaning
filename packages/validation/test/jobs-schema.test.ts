import { describe, expect, it } from "vitest";
import { createInternalServiceJobSchema, serviceJobScheduleSchema } from "../src";

const valid = {
  customerType: "RESIDENTIAL",
  customerName: "Test Customer",
  customerEmail: "test@example.invalid",
  customerPhone: "6045550100",
  companyName: null,
  propertyAddressLine1: "100 Test Street",
  propertyAddressLine2: null,
  city: "Vancouver",
  serviceAreaKey: "vancouver",
  province: "British Columbia",
  postalCode: "V5K0A1",
  propertyType: "Residential property",
  services: [{ serviceKey: "window-cleaning", scopeSummary: "Exterior windows" }],
  serviceScopeSummary: "Exterior window cleaning",
};
describe("Phase 9 job validation", () => {
  it("accepts canonical British Columbia operational input", () => {
    expect(createInternalServiceJobSchema.parse(valid).province).toBe("British Columbia");
  });
  it("rejects non-BC province, unknown fields, and noncanonical services", () => {
    expect(
      createInternalServiceJobSchema.safeParse({ ...valid, province: "Ontario" }).success,
    ).toBe(false);
    expect(
      createInternalServiceJobSchema.safeParse({ ...valid, referenceNumber: "JOB-2026-AAAAAAAAA" })
        .success,
    ).toBe(false);
    expect(
      createInternalServiceJobSchema.safeParse({ ...valid, services: [{ serviceKey: "made-up" }] })
        .success,
    ).toBe(false);
  });
  it("requires a written reason for explicit conflict override", () => {
    expect(
      serviceJobScheduleSchema.safeParse({
        version: 1,
        startLocal: "2026-08-01T09:00",
        estimatedDurationMinutes: 180,
        reason: "Customer agreed",
        overrideConflict: true,
      }).success,
    ).toBe(false);
  });
});
