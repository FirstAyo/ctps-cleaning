import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { customerJobNotification } from "@ctps/email";
import {
  JOB_REFERENCE_ALPHABET,
  JOB_REFERENCE_SUFFIX_LENGTH,
  JobReferenceService,
} from "../src/jobs/job-reference.service";
import { intervalsOverlap, vancouverLocalToUtc } from "../src/jobs/jobs-time";

describe("Phase 9 secure references and Vancouver scheduling", () => {
  it("generates immutable-style random references with more than 40 bits of suffix entropy", () => {
    const service = new JobReferenceService();
    const references = new Set(
      Array.from({ length: 200 }, () => service.generate(new Date("2026-07-25T00:00:00Z"))),
    );
    expect(references.size).toBe(200);
    for (const reference of references)
      expect(reference).toMatch(/^JOB-2026-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{9}$/);
    expect(JOB_REFERENCE_SUFFIX_LENGTH * Math.log2(JOB_REFERENCE_ALPHABET.length)).toBeGreaterThan(
      40,
    );
  });
  it("rejects the nonexistent Vancouver spring-forward wall time", () => {
    expect(() => vancouverLocalToUtc("2026-03-08T02:30")).toThrow(BadRequestException);
  });
  it("requires disambiguation for the repeated Vancouver autumn wall time", () => {
    expect(() => vancouverLocalToUtc("2026-11-01T01:30")).toThrow(BadRequestException);
    const earlier = vancouverLocalToUtc("2026-11-01T01:30", "earlier");
    const later = vancouverLocalToUtc("2026-11-01T01:30", "later");
    expect(later.getTime() - earlier.getTime()).toBe(3_600_000);
  });
  it("uses the expected daylight offset for an ordinary Vancouver local time", () => {
    expect(vancouverLocalToUtc("2026-07-25T09:00").toISOString()).toBe("2026-07-25T16:00:00.000Z");
  });
  it("treats exact schedule boundaries as non-overlapping", () => {
    const firstStart = new Date("2026-07-25T16:00:00Z");
    const firstEnd = new Date("2026-07-25T18:00:00Z");
    expect(
      intervalsOverlap(
        firstStart,
        firstEnd,
        new Date("2026-07-25T18:00:00Z"),
        new Date("2026-07-25T20:00:00Z"),
      ),
    ).toBe(false);
    expect(
      intervalsOverlap(
        firstStart,
        firstEnd,
        new Date("2026-07-25T17:59:00Z"),
        new Date("2026-07-25T20:00:00Z"),
      ),
    ).toBe(true);
  });
  it("builds a safe customer notification without private operational data or self-service links", () => {
    const message = customerJobNotification({
      to: "customer@example.invalid",
      from: "ctps@example.invalid",
      name: "Customer",
      reference: "job-2026-abcdefgh2",
      type: "SCHEDULED",
      scheduleText: "August 1 at 9:00 a.m. America/Vancouver",
      customerNote: "Please keep the gate accessible.",
    });
    expect(message.subject).toContain("JOB-2026-ABCDEFGH2");
    expect(message.text).not.toMatch(/internal note|storage\/private|database id|pay now/i);
    expect(message.text).toContain("does not provide a self-service booking");
  });
});
