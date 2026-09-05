import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ValorantGateway } from "./gateway/valorant.gateway";
import { ValorantLocalService } from "./gateway/valorant-local.service";
import { ValorantHistoryService } from "./gateway/valorant-history.service";
import { RiotClientService } from "./gateway/services/riot-client.service";
import { RiotPregameService } from "./gateway/services/riot-pregame.service";
import { RiotCoregameService } from "./gateway/services/riot-coregame.service";
import { RiotMatchHistoryService } from "./gateway/services/riot-match-history.service";
import { RiotMmrService } from "./gateway/services/riot-mmr.service";
import { RiotPresenceService } from "./gateway/services/riot-presence.service";
import { EconomyAdvisorService } from "./gateway/services/economy-advisor.service";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  controllers: [],
  providers: [
    RiotClientService,
    RiotPregameService,
    RiotCoregameService,
    RiotMatchHistoryService,
    RiotMmrService,
    RiotPresenceService,
    EconomyAdvisorService,
    ValorantGateway,
    ValorantLocalService,
    ValorantHistoryService,
  ],
})
export class AppModule {}
