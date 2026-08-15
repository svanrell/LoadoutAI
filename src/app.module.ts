import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { MatchesController } from "./valorant_api/matches/matches.controller";
import { MatchesService } from "./valorant_api/matches/matches.service";
import { ValorantGateway } from "./gateway/valorant.gateway";
import { ValorantLocalService } from "./gateway/valorant-local.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
  ],
  controllers: [
    MatchesController,
  ],
  providers: [
    MatchesService,
    ValorantGateway,
    ValorantLocalService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
