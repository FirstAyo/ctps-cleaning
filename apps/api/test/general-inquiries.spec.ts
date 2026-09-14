import { PERMISSION_KEYS } from "@ctps/permissions";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY } from "../src/auth/security.decorators";
import { GeneralInquiriesController } from "../src/quote-requests/general-inquiries.controller";
import { GeneralInquiryEmailService } from "../src/quote-requests/general-inquiry-email.service";
import { GeneralInquiriesService } from "../src/quote-requests/general-inquiries.service";

const submission = {
  idempotencyKey: "00000000-0000-4000-8000-000000000013",
  honeypot: "",
  name: "Alex Customer",
  email: "alex@example.com",
  phone: "+1 604 555 0100",
  serviceKey: "window-cleaning",
  message: "Please tell me more about the service.",
};

function request() {
  return { ip: "127.0.0.1", get: vi.fn().mockReturnValue("http://localhost:3000") };
}

describe("general inquiry persistence", () => {
  it("extends the outbox single-owner constraint to General Inquiries", () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "../../packages/database/prisma/migrations/20260823171500_general_inquiry_outbox_owner/migration.sql",
      ),
      "utf8",
    );
    expect(migration).toContain(
      'num_nonnulls("quoteRequestId", "serviceJobId", "generalInquiryId") = 1',
    );
  });

  it("persists before delivery, creates outbox records, and survives delivery failure", async () => {
    const created = { id: "inquiry-id", ...submission };
    const transaction = {
      generalInquiry: { create: vi.fn().mockResolvedValue(created) },
      emailOutbox: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    const database = {
      client: {
        generalInquiry: { findUnique: vi.fn().mockResolvedValue(null) },
        $transaction: vi.fn((callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
        ),
      },
    };
    const email = {
      records: vi.fn().mockReturnValue([{ templateKey: "customer" }, { templateKey: "staff" }]),
      dispatchForInquiry: vi.fn().mockRejectedValue(new Error("SMTP unavailable")),
    };
    const security = {
      assertTrustedBrowser: vi.fn(),
      throttle: vi.fn(),
      hash: vi.fn().mockReturnValue("hash"),
    };
    const service = new GeneralInquiriesService(
      database as never,
      {
        value: {
          EMAIL_FROM: "hello@example.invalid",
          QUOTE_STAFF_EMAIL: "staff@example.invalid",
        },
      } as never,
      security as never,
      email as never,
      {} as never,
    );

    await expect(service.submit(submission as never, request() as never)).resolves.toEqual({
      success: true,
      alreadySubmitted: false,
    });
    expect(security.assertTrustedBrowser).toHaveBeenCalled();
    expect(security.throttle).toHaveBeenCalledWith(expect.anything(), "general-inquiry-submit");
    expect(transaction.generalInquiry.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: submission.email }) }),
    );
    expect(transaction.emailOutbox.createMany).toHaveBeenCalled();
    expect(email.records).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: submission.email,
        customerName: submission.name,
        customerPhone: submission.phone,
        message: submission.message,
        staffEmail: "staff@example.invalid",
      }),
    );
    expect(email.dispatchForInquiry).toHaveBeenCalledWith("inquiry-id");
  });

  it("returns an idempotent replay without creating another inquiry", async () => {
    const transaction = vi.fn();
    const service = new GeneralInquiriesService(
      {
        client: {
          generalInquiry: { findUnique: vi.fn().mockResolvedValue({ id: "existing" }) },
          $transaction: transaction,
        },
      } as never,
      {} as never,
      {
        assertTrustedBrowser: vi.fn(),
        throttle: vi.fn(),
        hash: vi.fn().mockReturnValue("hash"),
      } as never,
      {} as never,
      {} as never,
    );
    await expect(service.submit(submission as never, request() as never)).resolves.toEqual({
      success: true,
      alreadySubmitted: true,
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("opens, marks, and archives private inquiries", async () => {
    const inquiry = { id: "inquiry", status: "NEW", archivedAt: null };
    const update = vi.fn().mockResolvedValue(inquiry);
    const findUnique = vi.fn().mockResolvedValue(inquiry);
    const service = new GeneralInquiriesService(
      { client: { generalInquiry: { findUnique, update } } } as never,
      {} as never,
      {} as never,
      {} as never,
      { record: vi.fn() } as never,
    );
    await expect(service.get("inquiry")).resolves.toEqual(inquiry);
    await service.setRead("inquiry", true, "actor");
    await service.archive("inquiry", true, "actor");
    expect(update).toHaveBeenCalledWith({ where: { id: "inquiry" }, data: { status: "READ" } });
    expect(update).toHaveBeenCalledWith({
      where: { id: "inquiry" },
      data: { archivedAt: expect.any(Date) },
    });
  });
});

describe("general inquiry authorization", () => {
  it("keeps anonymous submission public and routes both configured recipients", () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, GeneralInquiriesController.prototype.submit)).toBe(
      true,
    );
    const email = new GeneralInquiryEmailService(
      {} as never,
      { value: { EMAIL_DELIVERY_MODE: "disabled" } } as never,
    );
    const records = email.records({
      generalInquiryId: "inquiry-id",
      customerName: "Alex Customer",
      customerEmail: "alex@example.com",
      customerPhone: "+1 604 555 0100",
      serviceLabel: "Window Cleaning",
      message: "Please tell me more about the service.",
      from: "CTPS <sender@example.test>",
      staffEmail: "configured-staff@example.test",
    });
    expect(records.map(({ recipient }) => recipient)).toEqual([
      "alex@example.com",
      "configured-staff@example.test",
    ]);
    expect(JSON.stringify(records[1])).toContain("Please tell me more about the service.");
  });

  it("requires explicit permissions on every Admin handler", () => {
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, GeneralInquiriesController.prototype.list),
    ).toEqual([PERMISSION_KEYS.GENERAL_INQUIRIES_READ]);
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, GeneralInquiriesController.prototype.get),
    ).toEqual([PERMISSION_KEYS.GENERAL_INQUIRIES_READ]);
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, GeneralInquiriesController.prototype.setRead),
    ).toEqual([PERMISSION_KEYS.GENERAL_INQUIRIES_UPDATE]);
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, GeneralInquiriesController.prototype.archive),
    ).toEqual([PERMISSION_KEYS.GENERAL_INQUIRIES_ARCHIVE]);
  });
});
