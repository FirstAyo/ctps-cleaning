"use client";

import { useRef, useState, type KeyboardEvent } from "react";

import { GeneralInquiryForm } from "./general-inquiry-form";
import { QuoteRequestForm } from "./quote-request-form";

type RequestPath = "message" | "quote";

const paths: readonly RequestPath[] = ["message", "quote"];

export function RequestPathTabs() {
  const [activePath, setActivePath] = useState<RequestPath>("message");
  const tabRefs = useRef<Record<RequestPath, HTMLButtonElement | null>>({
    message: null,
    quote: null,
  });

  function selectFromKeyboard(event: KeyboardEvent<HTMLButtonElement>, current: RequestPath) {
    const currentIndex = paths.indexOf(current);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      nextIndex = (currentIndex + 1) % paths.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      nextIndex = (currentIndex - 1 + paths.length) % paths.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = paths.length - 1;
    else return;

    event.preventDefault();
    const nextPath = paths[nextIndex]!;
    setActivePath(nextPath);
    tabRefs.current[nextPath]?.focus();
  }

  return (
    <section
      aria-labelledby="request-options-heading"
      className="request-paths-section"
      id="request-options"
    >
      <div className="request-paths-intro">
        <p className="eyebrow">Choose your starting point</p>
        <h2 id="request-options-heading">How would you like to get in touch?</h2>
        <p>
          Send a quick message for a general question, or provide property details when you are
          ready for CTPS to review a quote request.
        </p>
      </div>

      <div aria-label="Contact options" className="request-path-tabs" role="tablist">
        <button
          aria-controls="request-message-panel"
          aria-selected={activePath === "message"}
          id="request-message-tab"
          onClick={() => setActivePath("message")}
          onKeyDown={(event) => selectFromKeyboard(event, "message")}
          ref={(element) => {
            tabRefs.current.message = element;
          }}
          role="tab"
          tabIndex={activePath === "message" ? 0 : -1}
          type="button"
        >
          <span>Send us a message</span>
          <small>A quick general inquiry</small>
        </button>
        <button
          aria-controls="request-quote-panel"
          aria-selected={activePath === "quote"}
          id="request-quote-tab"
          onClick={() => setActivePath("quote")}
          onKeyDown={(event) => selectFromKeyboard(event, "quote")}
          ref={(element) => {
            tabRefs.current.quote = element;
          }}
          role="tab"
          tabIndex={activePath === "quote" ? 0 : -1}
          type="button"
        >
          <span>Request a quote</span>
          <small>An eight-step property review</small>
        </button>
      </div>

      <div className="request-path-panel-shell">
        <div
          aria-labelledby="request-message-tab"
          className="request-path-panel request-message-panel"
          hidden={activePath !== "message"}
          id="request-message-panel"
          role="tabpanel"
          tabIndex={0}
        >
          <GeneralInquiryForm />
        </div>
        <div
          aria-labelledby="request-quote-tab"
          className="request-path-panel request-quote-panel"
          hidden={activePath !== "quote"}
          id="request-quote-panel"
          role="tabpanel"
          tabIndex={0}
        >
          <div className="request-detailed-path">
            <p className="eyebrow">Detailed quote request</p>
            <h2>Provide the details needed for a property review.</h2>
            <p>
              Choose services, describe the property, share timing preferences, and optionally
              include private photos.
            </p>
            <QuoteRequestForm />
          </div>
        </div>
      </div>
    </section>
  );
}
