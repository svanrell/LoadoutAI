import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { RiotClientService } from "./riot-client.service";

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
    }>;
  }>;
}

@Injectable()
export class RiotMatchHistoryService {
  private readonly logger = new Logger(RiotMatchHistoryService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly riotClient: RiotClientService,
  ) {}

  public async getPlayerMatchHistory(
    puuid: string,
    startIndex = 0,
    endIndex = 20,
  ): Promise<PlayerHistoryResponse | null> {
    const remote = await this.riotClient.getRemoteConfig();
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
    const remote = await this.riotClient.getRemoteConfig();
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

  public async fetchBatchedMatchDetails(
    matchIds: string[],
    batchSize = 5,
  ): Promise<Array<MatchDetailsResponse | null>> {
    const results: Array<MatchDetailsResponse | null> = [];
    for (let i = 0; i < matchIds.length; i += batchSize) {
      const batch = matchIds.slice(i, i + batchSize);
      const batchPromises = batch.map((id) => this.getMatchDetails(id));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    return results;
  }
}
