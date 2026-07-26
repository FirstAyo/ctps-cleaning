import nodemailer from "nodemailer";

export interface QuoteEmailMessage {
  readonly to: string;
  readonly from: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

export type EmailDeliveryConfig =
  | { readonly mode: "disabled" }
  | { readonly mode: "log-safe" }
  | {
      readonly mode: "smtp";
      readonly host: string;
      readonly port: number;
      readonly secure: boolean;
      readonly user?: string;
      readonly password?: string;
    };

export interface EmailDeliveryAdapter {
  send(message: QuoteEmailMessage): Promise<void>;
}

export function createEmailDeliveryAdapter(config: EmailDeliveryConfig): EmailDeliveryAdapter {
  if (config.mode === "disabled") return { send: async () => undefined };
  if (config.mode === "log-safe") {
    return {
      send: async (message) => {
        console.info("[email:log-safe]", {
          recipientDomain: message.to.split("@")[1],
          subject: message.subject,
        });
      },
    };
  }
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.user ? { auth: { user: config.user, pass: config.password ?? "" } } : {}),
  });
  return { send: async (message) => void (await transporter.sendMail(message)) };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function customerQuoteReceipt(input: {
  to: string;
  from: string;
  name: string;
  reference: string;
}): QuoteEmailMessage {
  const normalizedReference = input.reference.toUpperCase();
  const reference = escapeHtml(normalizedReference);
  const name = escapeHtml(input.name);
  return {
    to: input.to,
    from: input.from,
    subject: `We received your CTPS quote request ${normalizedReference}`,
    text: `Hello ${input.name},\n\nWe received quote request ${normalizedReference}. This confirms receipt only; it is not a quote or booking. CTPS will review the details and contact you.`,
    html: `<p>Hello ${name},</p><p>We received quote request <strong>${reference}</strong>.</p><p>This confirms receipt only; it is not a quote or booking. CTPS will review the details and contact you.</p>`,
  };
}

export function staffQuoteNotification(input: {
  to: string;
  from: string;
  reference: string;
  services: readonly string[];
}): QuoteEmailMessage {
  const normalizedReference = input.reference.toUpperCase();
  const reference = escapeHtml(normalizedReference);
  const services = input.services.map(escapeHtml).join(", ");
  return {
    to: input.to,
    from: input.from,
    subject: `New quote request ${normalizedReference}`,
    text: `A new quote request ${normalizedReference} was submitted for: ${input.services.join(", ")}. Sign in to the admin site to review private customer details.`,
    html: `<p>A new quote request <strong>${reference}</strong> was submitted for ${services}.</p><p>Sign in to the admin site to review private customer details.</p>`,
  };
}

export function customerJobNotification(input: {
  to: string;
  from: string;
  name: string;
  reference: string;
  type: "SCHEDULED" | "RESCHEDULED" | "CANCELLED" | "COMPLETED" | "REMINDER";
  scheduleText?: string;
  customerNote?: string;
}): QuoteEmailMessage {
  const reference = input.reference.toUpperCase();
  const labels = {
    SCHEDULED: "appointment scheduled",
    RESCHEDULED: "appointment updated",
    CANCELLED: "appointment cancelled",
    COMPLETED: "service completed",
    REMINDER: "appointment reminder",
  } as const;
  const detail = [input.scheduleText, input.customerNote].filter(Boolean).join("\n\n");
  return {
    to: input.to,
    from: input.from,
    subject: `CTPS ${labels[input.type]} — ${reference}`,
    text: `Hello ${input.name},\n\nYour CTPS service reference ${reference}: ${labels[input.type]}.${detail ? `\n\n${detail}` : ""}\n\nPlease contact CTPS directly if you need to discuss this appointment. This message does not provide a self-service booking, cancellation, or payment link.`,
    html: `<p>Hello ${escapeHtml(input.name)},</p><p>Your CTPS service reference <strong>${escapeHtml(reference)}</strong>: ${escapeHtml(labels[input.type])}.</p>${input.scheduleText ? `<p>${escapeHtml(input.scheduleText)}</p>` : ""}${input.customerNote ? `<p>${escapeHtml(input.customerNote)}</p>` : ""}<p>Please contact CTPS directly if you need to discuss this appointment. This message does not provide a self-service booking, cancellation, or payment link.</p>`,
  };
}
