import { Injectable, Logger } from "@nestjs/common";
import {
  MAPS_MAP,
  QUEUES_MAP,
  TIER_NAMES,
  resolveMapName,
  resolveQueueName,
  resolveTierName,
} from "./valorant.constants";
import {
  RiotClientService,
  RiotAuthCredentials,
  RiotRemoteConfig,
} from "./services/riot-client.service";
import {
  PlayerProfileTransformer,
  ProfileTransformInput,
} from "./services/player-profile.transformer";
import {
  RiotMatchHistoryService,
  PlayerHistoryItem,
  PlayerHistoryResponse,
  MatchDetailsResponse,
} from "./services/riot-match-history.service";
import {
  RiotMmrService,
  PlayerNameItem,
  PlayerMmrResponse,
  CompetitiveUpdateItem,
  CompetitiveUpdatesResponse,
  PlayerLoadoutResponse,
} from "./services/riot-mmr.service";
import { RiotPresenceService } from "./services/riot-presence.service";

export {
  MAPS_MAP,
  QUEUES_MAP,
  TIER_NAMES,
  resolveMapName,
  resolveQueueName,
  resolveTierName,
};
export type {
  RiotAuthCredentials,
  RiotRemoteConfig,
  PlayerHistoryItem,
  PlayerHistoryResponse,
  MatchDetailsResponse,
  PlayerNameItem,
  PlayerMmrResponse,
  CompetitiveUpdateItem,
  CompetitiveUpdatesResponse,
  PlayerLoadoutResponse,
};

export const MAX_HISTORY_MATCHES_FETCH = 8;
export const MAX_HISTORY_TIME_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const PROFILE_CACHE_TTL = 30 * 1000;

export interface SyncedMatchItem {
  id: string;
  isWin: boolean;
  agentId?: string;
  mapName: string;
  modeName: string;
  placement: string;
  isMvp: boolean;
  scoreWon: number;
  scoreLost: number;
  kd: string;
  kda: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  hsPercent: number;
  damageDelta: number;
  gameStartTime: number;
  dateTitle: string;
  timeAgo: string;
}

export interface SyncedAgentStat {
  agentId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface SyncedCompetitiveUpdate {
  matchId: string;
  mapName: string;
  matchStartTime: number;
  tier: number;
  tierName: string;
  rankedRating: number;
  rankedRatingEarned: number;
  performanceBonus: number;
  movement: string;
  dateStr: string;
  timeAgo: string;
}

export interface SyncedPlayerProfile {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
  currentTier: number;
  rankName: string;
  rankedRating: number;
  leaderboardRank: number;
  playerCardId?: string;
  accountLevel?: number;
  totalMatches: number;
  winRate: number;
  streak: Array<"W" | "L">;
  topAgents: SyncedAgentStat[];
  matches: SyncedMatchItem[];
  competitiveUpdates?: SyncedCompetitiveUpdate[];
}

@Injectable()
export class ValorantHistoryService {
  private readonly logger = new Logger(ValorantHistoryService.name);

  private profileCache: Map<
    string,
    { data: SyncedPlayerProfile; timestamp: number }
  > = new Map();
  private inFlightRequests: Map<string, Promise<SyncedPlayerProfile | null>> =
    new Map();

  constructor(
    private readonly riotClientService: RiotClientService,
    private readonly matchHistoryService: RiotMatchHistoryService,
    private readonly mmrService: RiotMmrService,
    private readonly presenceService: RiotPresenceService,
  ) {}

  public getCredentials(): RiotAuthCredentials | null {
    return this.riotClientService.getCredentials();
  }

  public async getRemoteConfig(): Promise<RiotRemoteConfig | null> {
    return this.riotClientService.getRemoteConfig();
  }

  public async getCurrentPlayerPuuid(): Promise<string | null> {
    return this.riotClientService.getCurrentPlayerPuuid();
  }

  public async getPlayerNames(puuids: string[]): Promise<PlayerNameItem[]> {
    return this.mmrService.getPlayerNames(puuids);
  }

  public async getPlayerMatchHistory(
    puuid: string,
    startIndex = 0,
    endIndex = 20,
  ): Promise<PlayerHistoryResponse | null> {
    return this.matchHistoryService.getPlayerMatchHistory(
      puuid,
      startIndex,
      endIndex,
    );
  }

  public async getMatchDetails(
    matchId: string,
  ): Promise<MatchDetailsResponse | null> {
    return this.matchHistoryService.getMatchDetails(matchId);
  }

  public async getPlayerMMR(puuid: string): Promise<PlayerMmrResponse | null> {
    return this.mmrService.getPlayerMMR(puuid);
  }

  public async getPlayerCompetitiveUpdates(
    puuid: string,
    startIndex = 0,
    endIndex = 15,
  ): Promise<CompetitiveUpdatesResponse | null> {
    return this.mmrService.getPlayerCompetitiveUpdates(
      puuid,
      startIndex,
      endIndex,
    );
  }

  public async getPlayerLoadout(
    puuid: string,
  ): Promise<PlayerLoadoutResponse | null> {
    return this.mmrService.getPlayerLoadout(puuid);
  }

  public async getLocalPresenceData(puuid: string): Promise<{
    playerCardId?: string;
    accountLevel?: number;
    competitiveTier?: number;
    leaderboardPosition?: number;
  } | null> {
    const presence = await this.presenceService.getLocalPlayerPresence(puuid);
    if (!presence) return null;
    return {
      playerCardId: presence.playerCardId,
      accountLevel: presence.accountLevel,
      competitiveTier: presence.competitiveTier,
      leaderboardPosition: presence.leaderboardPosition,
    };
  }

  public async getFullSyncedProfile(
    requestedPuuid?: string,
    forceRefresh = false,
  ): Promise<SyncedPlayerProfile | null> {
    let targetPuuid = requestedPuuid;
    if (!targetPuuid) {
      targetPuuid = (await this.getCurrentPlayerPuuid()) || undefined;
    }

    if (!targetPuuid) {
      this.logger.debug(
        "No se pudo determinar el PUUID del jugador (cliente de Riot no detectado).",
      );
      return null;
    }

    const now = Date.now();
    const cached = this.profileCache.get(targetPuuid);
    if (!forceRefresh && cached && now - cached.timestamp < PROFILE_CACHE_TTL) {
      return cached.data;
    }

    if (this.inFlightRequests.has(targetPuuid)) {
      return this.inFlightRequests.get(targetPuuid)!;
    }

    const fetchPromise = this.fetchAndBuildProfile(targetPuuid)
      .then((profile) => {
        if (profile) {
          this.profileCache.set(targetPuuid, {
            data: profile,
            timestamp: Date.now(),
          });
        }
        return profile;
      })
      .finally(() => {
        this.inFlightRequests.delete(targetPuuid);
      });

    this.inFlightRequests.set(targetPuuid, fetchPromise);
    return fetchPromise;
  }

  private async fetchAndBuildProfile(
    puuid: string,
  ): Promise<SyncedPlayerProfile | null> {
    const remote = await this.getRemoteConfig();
    if (!remote) return null;

    try {
      const [namesList, mmrData, historyData, compUpdatesRes, loadoutData] =
        await Promise.all([
          this.getPlayerNames([puuid]),
          this.getPlayerMMR(puuid),
          this.getPlayerMatchHistory(puuid, 0, MAX_HISTORY_MATCHES_FETCH),
          this.getPlayerCompetitiveUpdates(puuid, 0, 15),
          this.getPlayerLoadout(puuid),
        ]);

      const localPresence = await this.getLocalPresenceData(puuid);
      const matchIds = (historyData?.History || [])
        .slice(0, MAX_HISTORY_MATCHES_FETCH)
        .map((h) => h.MatchID);

      const detailsList =
        await this.matchHistoryService.fetchBatchedMatchDetails(matchIds, 4);

      const transformInput: ProfileTransformInput = {
        puuid,
        namesList,
        mmrData,
        historyData,
        compUpdatesRes,
        loadoutData,
        localPresence,
        detailsList,
        region: remote.region || process.env.VALORANT_REGION || "eu",
      };

      return PlayerProfileTransformer.transform(transformInput);
    } catch (error) {
      this.logger.error(
        `Error al construir perfil para PUUID ${puuid}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
