import { BadRequestException } from "@nestjs/common";

export const JOBS_TIME_ZONE = "America/Vancouver";

export function intervalsOverlap(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
): boolean {
  return firstStart < secondEnd && firstEnd > secondStart;
}

function parts(date: Date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: JOBS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
}

export function vancouverLocalToUtc(local: string, disambiguation?: "earlier" | "later"): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match)
    throw new BadRequestException({ code: "INVALID_LOCAL_TIME", message: "Use YYYY-MM-DDTHH:mm." });
  const [, year, month, day, hour, minute] = match;
  const wallClockAsUtc = Date.UTC(+year!, +month! - 1, +day!, +hour!, +minute!);
  const candidates: Date[] = [];
  for (let offsetMinutes = -12 * 60; offsetMinutes <= 14 * 60; offsetMinutes += 30) {
    const candidate = new Date(wallClockAsUtc - offsetMinutes * 60_000);
    const rendered = parts(candidate);
    if (
      rendered.year === year &&
      rendered.month === month &&
      rendered.day === day &&
      rendered.hour === hour &&
      rendered.minute === minute
    )
      candidates.push(candidate);
  }
  if (!candidates.length)
    throw new BadRequestException({
      code: "NONEXISTENT_LOCAL_TIME",
      message: "That Vancouver local time does not exist because of daylight saving time.",
    });
  candidates.sort((a, b) => a.getTime() - b.getTime());
  if (candidates.length > 1 && !disambiguation)
    throw new BadRequestException({
      code: "AMBIGUOUS_LOCAL_TIME",
      message: "Choose the earlier or later occurrence of this repeated Vancouver local time.",
    });
  return disambiguation === "later" ? candidates.at(-1)! : candidates[0]!;
}

export function formatVancouver(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JOBS_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
