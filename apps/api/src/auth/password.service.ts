import { Injectable } from "@nestjs/common";
import { hash, verify, type Options } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";
import { passwordSchema } from "@ctps/validation";

export const ARGON2_PARAMETERS = Object.freeze({
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const satisfies Options);

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    passwordSchema.parse(password);
    return hash(password, ARGON2_PARAMETERS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    if (password.length > 128) return false;
    try {
      return await verify(hash, password);
    } catch {
      return false;
    }
  }

  generateTemporaryPassword(): string {
    return `${randomBytes(24).toString("base64url")} A1`;
  }
}
