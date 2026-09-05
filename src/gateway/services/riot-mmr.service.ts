import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { RiotClientService } from "./riot-client.service";

export interface PlayerNameItem {
  DisplayName: string;
  Subject: string;
  GameName: string;
  TagLine: string;
}

export interface PlayerMmrResponse {
  Version?: number;
  Subject: string;
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
  QueueSkills?: {
    competitive?: {
      TotalGamesNeededForRating?: number;
      TotalGamesNeededForLeaderboard?: number;
      CurrentSeasonGamesNeededForRating?: number;
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
          WinsByTier: Record<string, number>;
          GamesNeededForRating: number;
          TotalWinsNeededForRank: number;
        }
      >;
    };
  };
}

export interface CompetitiveUpdateItem {
  MatchID: string;
  MapID: string;
  SeasonID?: string;
  MatchStartTime: number;
  TierAfterUpdate: number;
  TierBeforeUpdate?: number;
  RankedRatingAfterUpdate?: number;
  RankedRatingBeforeUpdate?: number;
  RankedRatingEarned?: number;
  RankedRatingPerformanceBonus?: number;
  CompetitiveMovement?: string;
}

export interface CompetitiveUpdatesResponse {
  Version?: number;
  Subject: string;
  Matches: CompetitiveUpdateItem[];
}

export interface PlayerLoadoutResponse {
  Subject: string;
  Version: number;
  Guns: Array<{
    ID: string;
    CharmInstanceID?: string;
    CharmID?: string;
    CharmLevelID?: string;
    SkinID: string;
    SkinLevelID: string;
    ChromaID: string;
    Attachments: string[];
  }>;
  Sprays: Array<{
    EquipSlotID: string;
    SprayID: string;
    SprayLevelID?: string;
  }>;
  Identity: {
    PlayerCardID: string;
    PlayerTitleID: string;
    AccountLevel: number;
    PreferredLevelBorderID: string;
    HideAccountLevel: boolean;
  };
  Incognito: boolean;
}

@Injectable()
export class RiotMmrService {
  private readonly logger = new Logger(RiotMmrService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly riotClient: RiotClientService,
  ) {}

  public async getPlayerNames(puuids: string[]): Promise<PlayerNameItem[]> {
    if (!puuids || puuids.length === 0) return [];
    const remote = await this.riotClient.getRemoteConfig();
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

  public async getPlayerMMR(puuid: string): Promise<PlayerMmrResponse | null> {
    const remote = await this.riotClient.getRemoteConfig();
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
    const remote = await this.riotClient.getRemoteConfig();
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
    const remote = await this.riotClient.getRemoteConfig();
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
}
