import { Injectable } from "@nestjs/common";
import { apiEnvironmentSchema } from "@ctps/validation";

@Injectable()
export class JobsConfigService {
  readonly value = apiEnvironmentSchema.parse(process.env);
}
