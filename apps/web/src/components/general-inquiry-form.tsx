"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button, Input, Label, Select, Textarea } from "@ctps/ui/primitives";
import { useToast } from "@ctps/ui/toast";

import { services } from "@/content/site";

type FieldErrors = Partial<Record<"name" | "email" | "phone" | "message", string>>;

function validate(form: HTMLFormElement) {
  const data = new FormData(form);
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const phone = String(data.get("phone") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();
  const errors: FieldErrors = {};
  if (name.length < 2) errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (phone && !/^[+()\- .0-9]{7,32}$/.test(phone))
    errors.phone = "Enter a valid phone number or leave this blank.";
  if (message.length < 10) errors.message = "Enter a message of at least 10 characters.";
  return { data, errors };
}

export function GeneralInquiryForm({
  headingLevel = "h2",
}: {
  readonly headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const { toast } = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const validated = validate(form);
    setErrors(validated.errors);
    if (Object.keys(validated.errors).length) {
      form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setBusy(true);
    try {
      idempotencyKey.current ??= crypto.randomUUID();
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          honeypot: String(validated.data.get("companyWebsite") ?? ""),
          name: String(validated.data.get("name") ?? ""),
          email: String(validated.data.get("email") ?? ""),
          phone: String(validated.data.get("phone") ?? "") || undefined,
          serviceKey: String(validated.data.get("serviceKey") ?? "") || undefined,
          message: String(validated.data.get("message") ?? ""),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(body.message ?? "Your message could not be sent.");
      form.reset();
      idempotencyKey.current = null;
      setSuccess(true);
      toast({
        title: "Message sent",
        description: "Thanks for contacting CTPS. Your message has been received.",
        tone: "success",
      });
    } catch (error) {
      toast({
        title: "Message not sent",
        description:
          error instanceof Error ? error.message : "Please check your connection and try again.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="general-inquiry-panel">
      <p className="eyebrow">Send us a message</p>
      <Heading>Prefer a simpler conversation?</Heading>
      <p className="general-inquiry-intro">
        Share a general question without completing the detailed property and photo workflow.
      </p>
      {success ? (
        <div className="general-inquiry-success" role="status">
          <strong>Message received.</strong>
          <p>Thanks for contacting CTPS. Your message has been received.</p>
          <Button onClick={() => setSuccess(false)} type="button" variant="outline">
            Send another message
          </Button>
        </div>
      ) : (
        <form className="general-inquiry-form" noValidate onSubmit={submit}>
          <div className="sr-only" aria-hidden="true">
            <Label htmlFor="inquiry-company-website">Company website</Label>
            <Input
              autoComplete="off"
              id="inquiry-company-website"
              name="companyWebsite"
              tabIndex={-1}
            />
          </div>
          <div>
            <Label htmlFor="inquiry-name">Name</Label>
            <Input
              aria-describedby={errors.name ? "inquiry-name-error" : undefined}
              aria-invalid={Boolean(errors.name)}
              autoComplete="name"
              id="inquiry-name"
              maxLength={120}
              name="name"
            />
            {errors.name ? (
              <p className="form-inline-error" id="inquiry-name-error">
                {errors.name}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="inquiry-email">Email</Label>
            <Input
              aria-describedby={errors.email ? "inquiry-email-error" : undefined}
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              id="inquiry-email"
              maxLength={254}
              name="email"
              type="email"
            />
            {errors.email ? (
              <p className="form-inline-error" id="inquiry-email-error">
                {errors.email}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="inquiry-phone">
              Phone <span>Optional</span>
            </Label>
            <Input
              aria-describedby={errors.phone ? "inquiry-phone-error" : undefined}
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              id="inquiry-phone"
              inputMode="tel"
              maxLength={32}
              name="phone"
              type="tel"
            />
            {errors.phone ? (
              <p className="form-inline-error" id="inquiry-phone-error">
                {errors.phone}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="inquiry-service">
              Service interest <span>Optional</span>
            </Label>
            <Select defaultValue="" id="inquiry-service" name="serviceKey">
              <option value="">General question</option>
              {services.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="inquiry-message">Message</Label>
            <Textarea
              aria-describedby={errors.message ? "inquiry-message-error" : "inquiry-message-help"}
              aria-invalid={Boolean(errors.message)}
              id="inquiry-message"
              maxLength={3000}
              name="message"
              rows={7}
            />
            {errors.message ? (
              <p className="form-inline-error" id="inquiry-message-error">
                {errors.message}
              </p>
            ) : (
              <p className="form-field-help" id="inquiry-message-help">
                Do not include passwords or payment details.
              </p>
            )}
          </div>
          <Button disabled={busy} type="submit">
            {busy ? "Sending…" : "Send message"}
          </Button>
          <p className="general-inquiry-privacy">
            CTPS uses these details only to review and respond to your inquiry.
          </p>
        </form>
      )}
    </div>
  );
}
