import { randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";

export const QUOTE_REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const QUOTE_REFERENCE_SUFFIX_LENGTH = 8;
export const QUOTE_REFERENCE_COLLISION_ATTEMPTS = 5;

@Injectable()
export class QuoteReferenceService {
  generate(date = new Date()): string {
    const random = randomBytes(QUOTE_REFERENCE_SUFFIX_LENGTH);
    let suffix = "";
    for (const byte of random) suffix += QUOTE_REFERENCE_ALPHABET[byte & 31];
    return `CTPS-${date.getUTCFullYear()}-${suffix}`;
  }
}
