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
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  services: readonly string[];
  propertyType: string;
  serviceArea: string;
}): QuoteEmailMessage {
  const normalizedReference = input.reference.toUpperCase();
  const reference = escapeHtml(normalizedReference);
  const services = input.services.map(escapeHtml).join(", ");
  const phoneText = input.customerPhone ? `\nPhone: ${input.customerPhone}` : "";
  const phoneHtml = input.customerPhone
    ? `<li><strong>Phone:</strong> ${escapeHtml(input.customerPhone)}</li>`
    : "";
  return {
    to: input.to,
    from: input.from,
    subject: `New quote request ${normalizedReference}`,
    text: `A new quote request ${normalizedReference} was submitted.\n\nCustomer: ${input.customerName}\nEmail: ${input.customerEmail}${phoneText}\nProperty type: ${input.propertyType}\nService area: ${input.serviceArea}\nServices: ${input.services.join(", ")}\n\nSign in to the admin site to review the full request and any private photos.`,
    html: `<p>A new quote request <strong>${reference}</strong> was submitted.</p><ul><li><strong>Customer:</strong> ${escapeHtml(input.customerName)}</li><li><strong>Email:</strong> ${escapeHtml(input.customerEmail)}</li>${phoneHtml}<li><strong>Property type:</strong> ${escapeHtml(input.propertyType)}</li><li><strong>Service area:</strong> ${escapeHtml(input.serviceArea)}</li><li><strong>Services:</strong> ${services}</li></ul><p>Sign in to the admin site to review the full request and any private photos.</p>`,
  };
}

export function customerGeneralInquiryReceipt(input: {
  to: string;
  from: string;
  name: string;
}): QuoteEmailMessage {
  return {
    to: input.to,
    from: input.from,
    subject: "We received your message to CTPS",
    text: `Hello ${input.name},\n\nThanks for contacting CTPS. Your message has been received. This acknowledgement is not a quote, booking, or appointment confirmation.`,
    html: `<p>Hello ${escapeHtml(input.name)},</p><p>Thanks for contacting CTPS. Your message has been received.</p><p>This acknowledgement is not a quote, booking, or appointment confirmation.</p>`,
  };
}

export function staffGeneralInquiryNotification(input: {
  to: string;
  from: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  serviceLabel?: string;
  message: string;
}): QuoteEmailMessage {
  const context = input.serviceLabel ? ` about ${input.serviceLabel}` : "";
  const phoneText = input.senderPhone ? `\nPhone: ${input.senderPhone}` : "";
  const phoneHtml = input.senderPhone
    ? `<li><strong>Phone:</strong> ${escapeHtml(input.senderPhone)}</li>`
    : "";
  return {
    to: input.to,
    from: input.from,
    subject: "New general inquiry received",
    text: `A new general inquiry${context} was submitted.\n\nSender: ${input.senderName}\nEmail: ${input.senderEmail}${phoneText}${input.serviceLabel ? `\nService: ${input.serviceLabel}` : ""}\n\nMessage:\n${input.message}\n\nSign in to the admin site to manage this inquiry.`,
    html: `<p>A new general inquiry${escapeHtml(context)} was submitted.</p><ul><li><strong>Sender:</strong> ${escapeHtml(input.senderName)}</li><li><strong>Email:</strong> ${escapeHtml(input.senderEmail)}</li>${phoneHtml}${input.serviceLabel ? `<li><strong>Service:</strong> ${escapeHtml(input.serviceLabel)}</li>` : ""}</ul><p><strong>Message:</strong></p><p>${escapeHtml(input.message).replaceAll("\n", "<br>")}</p><p>Sign in to the admin site to manage this inquiry.</p>`,
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
