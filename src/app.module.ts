import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ValorantGateway } from "./gateway/valorant.gateway";
import { ValorantLocalService } from "./gateway/valorant-local.service";
import { ValorantHistoryService } from "./gateway/valorant-history.service";
import { RiotClientService } from "./gateway/services/riot-client.service";
import { PlayerProfileTransformer } from "./gateway/services/player-profile.transformer";
import { RiotPregameService } from "./gateway/services/riot-pregame.service";
import { RiotCoregameService } from "./gateway/services/riot-coregame.service";

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
  controllers: [],
  providers: [
    RiotClientService,
    PlayerProfileTransformer,
    RiotPregameService,
    RiotCoregameService,
    ValorantGateway,
    ValorantLocalService,
    ValorantHistoryService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
