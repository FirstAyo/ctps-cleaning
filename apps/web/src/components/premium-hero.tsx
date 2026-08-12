"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "@ctps/ui/icons";
import { LinkButton } from "@ctps/ui/primitives";
import type { MarketingSection } from "@/lib/marketing-api";

const fallback = [
  "/images/phase-11/hero-residential.webp",
  "/images/phase-11/hero-commercial.webp",
  "/images/phase-11/hero-windows.webp",
  "/images/phase-11/hero-courtyard.webp",
] as const;

export function PremiumHero({
  section,
  media = [],
}: {
  readonly section: MarketingSection;
  readonly media?: readonly {
    id: string;
    altText: string;
    focalPointX: number;
    focalPointY: number;
  }[];
}) {
  const availableSlides = (
    section.mediaIds.length
      ? section.mediaIds.map((id) => ({
          src: `/media/marketing/${id}/hero`,
          focal: media.find((item) => item.id === id),
        }))
      : process.env.NODE_ENV === "production"
        ? []
        : fallback.map((src) => ({ src, focal: undefined }))
  ).slice(0, 4);
  const slides = availableSlides.length ? availableSlides : [{ src: null, focal: undefined }];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const visibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  useEffect(() => {
    if (!section.autoplay || paused || reduceMotion || slides.length < 2) return;
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % slides.length),
      section.intervalMs ?? 7000,
    );
    return () => clearInterval(timer);
  }, [paused, reduceMotion, section.autoplay, section.intervalMs, slides.length]);
  const go = (value: number) => setActive((value + slides.length) % slides.length);
  return (
    <section
      aria-roledescription="carousel"
      aria-label="CTPS property care"
      className={`premium-hero overlay-${(section.overlay ?? "BALANCED").toLowerCase()}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="premium-hero-media">
        {slides.map((slide, index) =>
          slide.src ? (
            <Image
              alt=""
              aria-hidden={index !== active}
              className={index === active ? "is-active" : ""}
              fill
              key={slide.src}
              priority={index === 0}
              sizes="100vw"
              src={slide.src}
              style={
                slide.focal
                  ? { objectPosition: `${slide.focal.focalPointX}% ${slide.focal.focalPointY}%` }
                  : undefined
              }
            />
          ) : null,
        )}
      </div>
      <div className="premium-hero-shade" />
      <div className="premium-hero-content">
        <p className="eyebrow">{section.eyebrow}</p>
        <h1>{section.title}</h1>
        {section.body ? <p className="premium-hero-copy">{section.body}</p> : null}
        <div className="mt-8 flex flex-wrap gap-3">
          {section.primaryCta ? (
            <LinkButton className="min-h-12 px-6" href={section.primaryCta.href}>
              {section.primaryCta.label}
            </LinkButton>
          ) : null}
          {section.secondaryCta ? (
            <LinkButton
              className="min-h-12 border-white/60 bg-black/10 px-6 text-white hover:bg-white/10"
              href={section.secondaryCta.href}
              variant="outline"
            >
              {section.secondaryCta.label}
            </LinkButton>
          ) : null}
        </div>
      </div>
      {slides.length > 1 ? (
        <div className="premium-hero-controls">
          <button aria-label="Previous slide" onClick={() => go(active - 1)}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <div aria-label={`Slide ${active + 1} of ${slides.length}`} className="premium-hero-dots">
            {slides.map((_slide, index) => (
              <button
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                key={index}
                onClick={() => go(index)}
              />
            ))}
          </div>
          <button aria-label="Next slide" onClick={() => go(active + 1)}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
