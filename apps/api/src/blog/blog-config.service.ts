import { Injectable } from "@nestjs/common";
import { apiEnvironmentSchema } from "@ctps/validation";

@Injectable()
export class BlogConfigService {
  readonly value = apiEnvironmentSchema.parse(process.env);
}
