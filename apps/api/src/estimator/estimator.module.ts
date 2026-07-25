import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { EstimatorController } from "./estimator.controller";
import { EstimatorService } from "./estimator.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EstimatorController],
  providers: [EstimatorService],
})
export class EstimatorModule {}
