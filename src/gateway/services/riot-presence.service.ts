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
    if (!rawPrivate || typeof rawPrivate !== "string" || !rawPrivate.trim()) {
      return null;
    }
    try {
      const decodedJson = Buffer.from(rawPrivate.trim(), "base64").toString(
        "utf8",
      );
      if (
        !decodedJson.trim().startsWith("{") &&
        !decodedJson.trim().startsWith("[")
      ) {
        return null;
      }
      const parsed = JSON.parse(decodedJson);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  public parsePresenceData(
    puuid: string,
    rawData: unknown,
  ): DecodedPresenceInfo | null {
    if (
      !rawData ||
      typeof rawData !== "object" ||
      typeof puuid !== "string" ||
      !puuid.trim()
    ) {
      return null;
    }

    const data = rawData as Record<string, unknown>;
    const rawMatch =
      data.matchPresenceData && typeof data.matchPresenceData === "object"
        ? (data.matchPresenceData as Record<string, unknown>)
        : undefined;
    const rawParty =
      data.partyPresenceData && typeof data.partyPresenceData === "object"
        ? (data.partyPresenceData as Record<string, unknown>)
        : undefined;

    const extractString = (val: unknown): string | undefined => {
      if (typeof val === "string" && val.trim().length > 0) {
        return val.trim();
      }
      return undefined;
    };

    const extractNumber = (val: unknown): number | undefined => {
      if (typeof val === "number" && Number.isFinite(val)) {
        return val;
      }
      return undefined;
    };

    const sessionLoopState =
      extractString(data.sessionLoopState) ||
      extractString(rawMatch?.sessionLoopState) ||
      extractString(rawParty?.partyOwnerSessionLoopState) ||
      "";

    // 1. matchMap: Primero formato real nested de Riot, fallback a raíz
    const matchMap =
      extractString(rawMatch?.matchMap) || extractString(data.matchMap);

    // 2. queueId: Primero formato real nested de Riot, fallback a raíz
    const queueId =
      extractString(rawMatch?.queueId) || extractString(data.queueId);

    const partyId =
      extractString(data.partyId) || extractString(rawParty?.partyId);

    const allyScore = extractNumber(data.partyOwnerMatchScoreAllyTeam);
    const enemyScore = extractNumber(data.partyOwnerMatchScoreEnemyTeam);
    const playerCardId = extractString(data.playerCardId);
    const accountLevel = extractNumber(data.accountLevel);
    const competitiveTier = extractNumber(data.competitiveTier);
    const leaderboardPosition = extractNumber(data.leaderboardPosition);

    return {
      puuid: puuid.trim(),
      sessionLoopState,
      matchMap,
      queueId,
      partyId,
      allyScore,
      enemyScore,
      playerCardId,
      accountLevel,
      competitiveTier,
      leaderboardPosition,
    };
  }

  public async getLocalPlayerPresence(
    puuid: string,
  ): Promise<DecodedPresenceInfo | null> {
    if (!puuid || typeof puuid !== "string" || !puuid.trim()) return null;
    const presences = await this.getRawPresences();
    const myPresence = presences.find((p) => p.puuid === puuid);
    if (!myPresence || !myPresence.private) return null;

    const data = this.decodePrivateField(myPresence.private);
    if (!data) return null;

    return this.parsePresenceData(puuid, data);
  }
}
