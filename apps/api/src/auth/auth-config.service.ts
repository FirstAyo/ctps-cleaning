import { Injectable } from "@nestjs/common";
import { apiEnvironmentSchema, type ApiEnvironment } from "@ctps/validation";

@Injectable()
export class AuthConfigService {
  readonly value: ApiEnvironment;

  constructor() {
    this.value = apiEnvironmentSchema.parse(process.env);
  }
}
