import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { RiotClientService } from "./riot-client.service";

export interface ValorantPrivatePresenceData {
  sessionLoopState: string;
  partyId?: string;
  partyOwnerMatchScoreAllyTeam?: number;
  partyOwnerMatchScoreEnemyTeam?: number;
  matchPresenceData?: {
    sessionLoopState?: string;
    matchMap?: string;
    queueId?: string;
  };
  partyPresenceData?: {
    partyOwnerSessionLoopState?: string;
  };
}

export interface PresencesResponseItem {
  puuid: string;
  private: string;
}

export interface DecodedPresenceInfo {
  puuid: string;
  sessionLoopState: string;
  matchMap?: string;
  queueId?: string;
  partyId?: string;
  allyScore?: number;
  enemyScore?: number;
  playerCardId?: string;
  accountLevel?: number;
  competitiveTier?: number;
  leaderboardPosition?: number;
}

@Injectable()
export class RiotPresenceService {
  private readonly logger = new Logger(RiotPresenceService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly riotClient: RiotClientService,
  ) {}

  public async getRawPresences(): Promise<PresencesResponseItem[]> {
    const credentials = this.riotClient.getCredentials();
    if (!credentials) return [];

    try {
      const res = await firstValueFrom(
        this.httpService.get<{ presences?: PresencesResponseItem[] }>(
          `${credentials.url}/chat/v4/presences`,
          {
            headers: { Authorization: credentials.token },
            httpsAgent: this.riotClient.getLocalHttpsAgent(credentials.url),
          },
        ),
      );
      return res.data?.presences || [];
    } catch (error) {
      this.logger.debug(
        `Error al obtener presencias de chat: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  public decodePrivateField(
    rawPrivate: string,
  ): Record<string, unknown> | null {
    if (!rawPrivate) return null;
    try {
      const decodedJson = Buffer.from(rawPrivate, "base64").toString("utf8");
      return JSON.parse(decodedJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  public async getLocalPlayerPresence(
    puuid: string,
  ): Promise<DecodedPresenceInfo | null> {
    const presences = await this.getRawPresences();
    const myPresence = presences.find((p) => p.puuid === puuid);
    if (!myPresence || !myPresence.private) return null;

    const data = this.decodePrivateField(myPresence.private);
    if (!data) return null;

    const rawMatch = data.matchPresenceData as
      | Record<string, unknown>
      | undefined;
    const rawParty = data.partyPresenceData as
      | Record<string, unknown>
      | undefined;

    let sessionLoopState = "";
    if (typeof data.sessionLoopState === "string") {
      sessionLoopState = data.sessionLoopState;
    } else if (typeof rawMatch?.sessionLoopState === "string") {
      sessionLoopState = rawMatch.sessionLoopState;
    } else if (typeof rawParty?.partyOwnerSessionLoopState === "string") {
      sessionLoopState = rawParty.partyOwnerSessionLoopState;
    }

    return {
      puuid,
      sessionLoopState,
      matchMap: data.matchMap as string | undefined,
      queueId: data.queueId as string | undefined,
      partyId: data.partyId as string | undefined,
      allyScore:
        typeof data.partyOwnerMatchScoreAllyTeam === "number"
          ? data.partyOwnerMatchScoreAllyTeam
          : undefined,
      enemyScore:
        typeof data.partyOwnerMatchScoreEnemyTeam === "number"
          ? data.partyOwnerMatchScoreEnemyTeam
          : undefined,
      playerCardId: data.playerCardId as string | undefined,
      accountLevel:
        typeof data.accountLevel === "number" ? data.accountLevel : undefined,
      competitiveTier:
        typeof data.competitiveTier === "number"
          ? data.competitiveTier
          : undefined,
      leaderboardPosition:
        typeof data.leaderboardPosition === "number"
          ? data.leaderboardPosition
          : undefined,
    };
  }
}
