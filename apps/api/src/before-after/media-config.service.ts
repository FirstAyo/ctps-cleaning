import { Injectable } from "@nestjs/common";
import { apiEnvironmentSchema } from "@ctps/validation";

@Injectable()
export class MediaConfigService {
  readonly value: ReturnType<typeof apiEnvironmentSchema.parse>;
  constructor() {
    this.value = apiEnvironmentSchema.parse(process.env);
  }
}
