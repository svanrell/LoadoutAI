import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

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
import { PlayerProfileTransformer } from "./services/player-profile.transformer";

export {
  MAPS_MAP,
  QUEUES_MAP,
  TIER_NAMES,
  resolveMapName,
  resolveQueueName,
  resolveTierName,
};
export type { RiotAuthCredentials, RiotRemoteConfig };

// ==========================================
// INTERFACES DE RESPUESTA DE RIOT (PD SERVICE)
// ==========================================

export interface PlayerHistoryItem {
  MatchID: string;
  GameStartTimeMillis: number;
  QueueID: string;
}

export interface PlayerHistoryResponse {
  Subject: string;
  BeginIndex: number;
  EndIndex: number;
  Total: number;
  History: PlayerHistoryItem[];
}

export interface MatchDetailsResponse {
  matchInfo: {
    matchId: string;
    mapId: string;
    gameLengthMillis: number;
    gameStartMillis: number;
    provisioningFlowId?: string;
    provisioningFlowID?: string;
    provisioningFlow?: string;
    isCompleted: boolean;
    customGameName?: string;
    CustomGameName?: string;
    queueId?: string;
    queueID?: string;
    QueueID?: string;
    gameMode: string;
    isRanked?: boolean;
    isCustomGame?: boolean;
    seasonId: string;
  };
  players: Array<{
    subject: string;
    gameName: string;
    tagLine: string;
    teamId: string;
    characterId: string;
    stats?: {
      score: number;
      roundsPlayed: number;
      kills: number;
      deaths: number;
      assists: number;
      playtimeMillis?: number;
    };
    competitiveTier?: number;
    playerCard?: string;
    playerCardId?: string;
    playerTitle?: string;
    accountLevel?: number;
  }>;
  teams: Array<{
    teamId: string;
    won: boolean;
    roundsPlayed: number;
    roundsWon: number;
  }>;
  roundResults?: Array<{
    roundNum: number;
    roundResult: string;
    winningTeam: string;
    playerStats?: Array<{
      subject: string;
      damage?: Array<{
        receiver: string;
        damage: number;
        legshots: number;
        bodyshots: number;
        headshots: number;
      }>;
      score: number;
    }>;
  }>;
}

export interface PlayerMmrResponse {
  Version: number;
  Subject: string;
  QueueSkills?: {
    competitive?: {
      TotalGamesNeededForRating: number;
      TotalGamesNeededForLeaderboard: number;
      CurrentSeasonGamesNeededForRating: number;
      SeasonalInfoBySeasonID?: Record<
        string,
        {
          SeasonID: string;
          NumberOfWins: number;
          NumberOfWinsWithPlacements: number;
          NumberOfGames: number;
          Rank: number;
          CapstoneWins: number;
          LeaderboardRank: number;
          CompetitiveTier: number;
          RankedRating: number;
          WinsByTier?: Record<string, number>;
          GamesNeededForRating: number;
          TotalWinsNeededForRank: number;
        }
      >;
    };
  };
  LatestCompetitiveUpdate?: {
    MatchID: string;
    MapID: string;
    SeasonID: string;
    MatchStartTime: number;
    TierAfterUpdate: number;
    TierBeforeUpdate: number;
    RankedRatingAfterUpdate: number;
    RankedRatingBeforeUpdate: number;
    RankedRatingEarned: number;
    RankedRatingPerformanceBonus: number;
    CompetitiveMovement: string;
  };
}

export interface CompetitiveUpdateItem {
  MatchID: string;
  MapID: string;
  SeasonID: string;
  MatchStartTime: number;
  TierAfterUpdate: number;
  TierBeforeUpdate: number;
  RankedRatingAfterUpdate: number;
  RankedRatingBeforeUpdate: number;
  RankedRatingEarned: number;
  RankedRatingPerformanceBonus: number;
  CompetitiveMovement: string;
  AFKPenalty?: number;
}

export interface CompetitiveUpdatesResponse {
  Version: number;
  Subject: string;
  Matches: CompetitiveUpdateItem[];
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

export interface PlayerNameItem {
  DisplayName: string;
  Subject: string;
  GameName: string;
  TagLine: string;
}

export interface SyncedMatchItem {
  id: string;
  isWin: boolean;
  agentId: string;
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

export const MAX_HISTORY_MONTHS = 6;
export const MAX_HISTORY_DAYS = 180;
export const MAX_HISTORY_TIME_WINDOW_MS = 180 * 24 * 60 * 60 * 1000;

export interface PlayerLoadoutResponse {
  Subject: string;
  Version: number;
  Identity: {
    PlayerCardID: string;
    PlayerTitleID: string;
    AccountLevel: number;
    PreferredLevelBorderID: string;
    HideAccountLevel: boolean;
  };
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
    private readonly httpService: HttpService,
    private readonly riotClientService: RiotClientService,
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
    if (!puuids || puuids.length === 0) return [];
    const remote = await this.getRemoteConfig();
    if (!remote) return [];

    try {
      const res = await firstValueFrom(
        this.httpService.put<PlayerNameItem[]>(
          `${remote.pdUrl}/name-service/v2/players`,
          puuids,
          { headers: remote.headers },
        ),
      );
      return res.data || [];
    } catch (error) {
      this.logger.warn(
        `Error al consultar name-service: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  public async getPlayerMatchHistory(
    puuid: string,
    startIndex = 0,
    endIndex = 20,
  ): Promise<PlayerHistoryResponse | null> {
    const remote = await this.getRemoteConfig();
    if (!remote) return null;

    try {
      const res = await firstValueFrom(
        this.httpService.get<PlayerHistoryResponse>(
          `${remote.pdUrl}/match-history/v1/history/${puuid}?startIndex=${startIndex}&endIndex=${endIndex}`,
          { headers: remote.headers },
        ),
      );
      return res.data || null;
    } catch (error) {
      this.logger.warn(
        `Error al obtener match-history: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  public async getMatchDetails(
    matchId: string,
  ): Promise<MatchDetailsResponse | null> {
    const remote = await this.getRemoteConfig();
    if (!remote) return null;

    try {
      const res = await firstValueFrom(
        this.httpService.get<MatchDetailsResponse>(
          `${remote.pdUrl}/match-details/v1/matches/${matchId}`,
          { headers: remote.headers },
        ),
      );
      return res.data || null;
    } catch (error) {
      this.logger.warn(
        `Error al obtener match-details (${matchId}): ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  public async getPlayerMMR(puuid: string): Promise<PlayerMmrResponse | null> {
    const remote = await this.getRemoteConfig();
    if (!remote) return null;

    try {
      const res = await firstValueFrom(
        this.httpService.get<PlayerMmrResponse>(
          `${remote.pdUrl}/mmr/v1/players/${puuid}`,
          { headers: remote.headers },
        ),
      );
      return res.data || null;
    } catch (error) {
      this.logger.warn(
        `Error al obtener MMR: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  public async getPlayerCompetitiveUpdates(
    puuid: string,
    startIndex = 0,
    endIndex = 15,
  ): Promise<CompetitiveUpdatesResponse | null> {
    const remote = await this.getRemoteConfig();
    if (!remote) return null;

    try {
      const res = await firstValueFrom(
        this.httpService.get<CompetitiveUpdatesResponse>(
          `${remote.pdUrl}/mmr/v1/players/${puuid}/competitiveupdates?startIndex=${startIndex}&endIndex=${endIndex}&queue=competitive`,
          { headers: remote.headers },
        ),
      );
      return res.data || null;
    } catch (_error) {
      try {
        const fallbackRes = await firstValueFrom(
          this.httpService.get<CompetitiveUpdatesResponse>(
            `${remote.pdUrl}/mmr/v1/players/${puuid}/competitiveupdates?startIndex=${startIndex}&endIndex=${endIndex}`,
            { headers: remote.headers },
          ),
        );
        return fallbackRes.data || null;
      } catch (fallbackError) {
        this.logger.warn(
          `Error al obtener competitiveupdates: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
        );
        return null;
      }
    }
  }

  public async getPlayerLoadout(
    puuid: string,
  ): Promise<PlayerLoadoutResponse | null> {
    const remote = await this.getRemoteConfig();
    if (!remote) return null;

    try {
      const res = await firstValueFrom(
        this.httpService.get<PlayerLoadoutResponse>(
          `${remote.pdUrl}/personalization/v2/players/${puuid}/playerloadout`,
          { headers: remote.headers },
        ),
      );
      return res.data || null;
    } catch (error) {
      this.logger.warn(
        `Error al obtener playerloadout: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  public async getLocalPresenceData(puuid: string): Promise<{
    playerCardId?: string;
    accountLevel?: number;
    competitiveTier?: number;
    leaderboardPosition?: number;
  } | null> {
    const credentials = this.getCredentials();
    if (!credentials) return null;

    try {
      const res = await firstValueFrom(
        this.httpService.get<{
          presences?: Array<{ puuid: string; private: string }>;
        }>(`${credentials.url}/chat/v4/presences`, {
          headers: { Authorization: credentials.token },
          httpsAgent: this.riotClientService.getLocalHttpsAgent(
            credentials.url,
          ),
        }),
      );
      const myPresence = res.data.presences?.find((p) => p.puuid === puuid);
      if (myPresence && myPresence.private) {
        const decoded = Buffer.from(myPresence.private, "base64").toString(
          "utf8",
        );
        const parsed = JSON.parse(decoded);
        return {
          playerCardId: parsed.playerCardId,
          accountLevel: parsed.accountLevel,
          competitiveTier: parsed.competitiveTier,
          leaderboardPosition: parsed.leaderboardPosition,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  public async getFullSyncedProfile(
    targetPuuid?: string,
    forceRefresh = false,
  ): Promise<SyncedPlayerProfile | null> {
    const puuid = targetPuuid || (await this.getCurrentPlayerPuuid());
    if (!puuid) {
      this.logger.warn("No se pudo obtener el PUUID para sincronizar perfil.");
      return null;
    }

    const cached = this.profileCache.get(puuid);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 25_000) {
      return cached.data;
    }

    const inFlight = this.inFlightRequests.get(puuid);
    if (inFlight) {
      return inFlight;
    }

    const fetchPromise = this.fetchProfileFromRiot(puuid);
    this.inFlightRequests.set(puuid, fetchPromise);

    try {
      const result = await fetchPromise;
      if (result) {
        this.profileCache.set(puuid, { data: result, timestamp: Date.now() });
      }
      return result || (cached ? cached.data : null);
    } catch {
      return cached ? cached.data : null;
    } finally {
      this.inFlightRequests.delete(puuid);
    }
  }

  private async fetchProfileFromRiot(
    puuid: string,
  ): Promise<SyncedPlayerProfile | null> {
    try {
      const [
        namesList,
        mmrData,
        historyData,
        compUpdatesRes,
        loadoutData,
        localPresence,
      ] = await Promise.all([
        this.getPlayerNames([puuid]),
        this.getPlayerMMR(puuid),
        this.getPlayerMatchHistory(puuid, 0, 20),
        this.getPlayerCompetitiveUpdates(puuid, 0, 20),
        this.getPlayerLoadout(puuid),
        this.getLocalPresenceData(puuid),
      ]);

      const historyList = historyData?.History || [];
      const detailPromises = historyList
        .slice(0, 20)
        .map((h) => this.getMatchDetails(h.MatchID));
      const detailsList = await Promise.all(detailPromises);

      const profile = PlayerProfileTransformer.transform({
        puuid,
        namesList,
        mmrData,
        historyData,
        compUpdatesRes,
        loadoutData,
        localPresence,
        detailsList,
        region: process.env.VALORANT_REGION || "eu",
      });

      return profile;
    } catch (error) {
      this.logger.error(
        `Error al construir perfil sincronizado: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
