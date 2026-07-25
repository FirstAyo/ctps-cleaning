import { Injectable } from "@nestjs/common";
import { apiEnvironmentSchema } from "@ctps/validation";

@Injectable()
export class QuoteConfigService {
  readonly value = apiEnvironmentSchema.parse(process.env);
}
