import { Injectable } from "@nestjs/common";
import { randomInt } from "node:crypto";

export const JOB_REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const JOB_REFERENCE_SUFFIX_LENGTH = 9;
export const JOB_REFERENCE_COLLISION_ATTEMPTS = 8;

@Injectable()
export class JobReferenceService {
  generate(now = new Date()): string {
    const suffix = Array.from(
      { length: JOB_REFERENCE_SUFFIX_LENGTH },
      () => JOB_REFERENCE_ALPHABET[randomInt(JOB_REFERENCE_ALPHABET.length)],
    ).join("");
    return `JOB-${now.getUTCFullYear()}-${suffix}`;
  }
}
