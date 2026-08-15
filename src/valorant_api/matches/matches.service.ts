import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { map, Observable, tap, switchMap } from "rxjs";
import { AxiosResponse } from "axios";
import { saveToCsv, appendToCsv } from "../../utils/csv-helper";

export interface PlayerDto {
  puuid?: string;
  gameName?: string;
  tagLine?: string;
  leaderboardRank: number;
  rankedRating: number;
  numberOfWins: number;
}

export interface LeaderboardDto {
  shard: string;
  actId: string;
  totalPlayers: number;
  players: PlayerDto[];
}

export interface MatchInfoDto {
  matchId: string;
  mapId: string;
  gameLengthMillis: number;
  gameStartMillis: number;
  provisioningFlowId: string;
  isCompleted: boolean;
  queueId: string;
  gameMode: string;
  isRanked: boolean;
  seasonId: string;
}

export interface PlayerStatsDto {
  score: number;
  roundsPlayed: number;
  kills: number;
  deaths: number;
  assists: number;
  playtimeMillis?: number;
}

export interface PlayerMatchDto {
  subject: string;
  gameName?: string;
  tagLine?: string;
  teamId: string;
  characterId: string;
  stats: PlayerStatsDto;
  competitiveTier: number;
}

export interface TeamDto {
  teamId: string;
  won: boolean;
  roundsPlayed: number;
  roundsWon: number;
}

export interface EconomyDto {
  loadoutValue: number;
  weapon: string;
  armor: string;
  remaining: number;
  spent: number;
}

export interface PlayerRoundStatsDto {
  subject: string;
  score: number;
  economy: EconomyDto;
  wasAfk: boolean;
  wasPenalized: boolean;
}

export interface RoundResultDto {
  roundNum: number;
  roundResult: string;
  winningTeam: string;
  bombPlanter?: string;
  bombDefuser?: string;
  playerStats: PlayerRoundStatsDto[];
}

export interface MatchDto {
  matchInfo: MatchInfoDto;
  players: PlayerMatchDto[];
  teams: TeamDto[];
  roundResults: RoundResultDto[];
}

export interface PlayerRoundPurchase {
  matchId: string;
  roundNum: number;
  puuid: string;
  score: number;
  loadoutValue: number;
  weapon: string;
  armor: string;
  spent: number;
  remaining: number;
  wasAfk: string;
  wasPenalized: string;
}

@Injectable()
export class MatchesService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  getActiveActId(): Observable<string> {
    const apiKey =
      this.configService.get<string>("VALORANT_API_KEY") ||
      this.configService.get<string>("RIOT_API_KEY") ||
      "";
    const region = this.configService.get<string>("VALORANT_REGION") || "eu";
    const apiUrl = `https://${region}.api.riotgames.com/val/content/v1/contents`;

    return this.httpService
      .get<{ acts?: { id: string; type?: string; isActive: boolean }[] }>(apiUrl, {
        headers: {
          "X-Riot-Token": apiKey,
        },
      })
      .pipe(
        map((response) => {
          const acts = response.data?.acts || [];
          const activeAct = acts.find(
            (act) => act.type === "act" && act.isActive === true,
          );
          if (!activeAct) {
            throw new Error("No active act was found in the Valorant content.");
          }
          return activeAct.id;
        }),
      );
  }

  loadActiveLeaderboard(
    size: number = 200,
    startIndex: number = 0,
  ): Observable<LeaderboardDto> {
    return this.getActiveActId().pipe(
      switchMap((actId) => this.loadLeaderboard(actId, size, startIndex)),
    );
  }

  loadLeaderboard(
    actId: string,
    size: number = 200,
    startIndex: number = 0,
  ): Observable<LeaderboardDto> {
    const apiKey =
      this.configService.get<string>("VALORANT_API_KEY") ||
      this.configService.get<string>("RIOT_API_KEY") ||
      "";
    const region = this.configService.get<string>("VALORANT_REGION") || "eu";

    const apiUrl = `https://${region}.api.riotgames.com/val/ranked/v1/leaderboards/by-act/${actId}`;

    return this.httpService
      .get<LeaderboardDto>(apiUrl, {
        headers: {
          "X-Riot-Token": apiKey,
        },
        params: {
          size,
          startIndex,
        },
      })
      .pipe(
        map((response: AxiosResponse<LeaderboardDto>) => response.data),
        tap((leaderboard: LeaderboardDto) => {
          if (leaderboard && Array.isArray(leaderboard.players)) {
            saveToCsv(
              "ranked_leaderboard.csv",
              leaderboard.players,
              [
                "leaderboardRank",
                "puuid",
                "gameName",
                "tagLine",
                "rankedRating",
                "numberOfWins",
              ],
              (p: PlayerDto) => [
                p.leaderboardRank,
                p.puuid || "ANONYMOUS",
                p.gameName || "ANONYMOUS",
                p.tagLine || "",
                p.rankedRating,
                p.numberOfWins,
              ],
            );
          }
        }),
      );
  }

  loadMatch(matchId: string): Observable<MatchDto> {
    const apiKey =
      this.configService.get<string>("VALORANT_API_KEY") ||
      this.configService.get<string>("RIOT_API_KEY") ||
      "";
    const region = this.configService.get<string>("VALORANT_REGION") || "eu";

    const apiUrl = `https://${region}.api.riotgames.com/val/match/v1/matches/${matchId}`;

    return this.httpService
      .get<MatchDto>(apiUrl, {
        headers: {
          "X-Riot-Token": apiKey,
        },
      })
      .pipe(
        map((response: AxiosResponse<MatchDto>) => response.data),
        tap((match: MatchDto) => {
          if (match && match.matchInfo) {
            const matchInfo = match.matchInfo;

            appendToCsv(
              "match_metadata.csv",
              [matchInfo],
              [
                "matchId",
                "mapId",
                "gameLengthMillis",
                "gameStartMillis",
                "queueId",
                "isRanked",
                "seasonId",
              ],
              (info: MatchInfoDto) => [
                info.matchId,
                info.mapId,
                info.gameLengthMillis,
                info.gameStartMillis,
                info.queueId,
                info.isRanked ? "YES" : "NO",
                info.seasonId,
              ],
            );

            if (Array.isArray(match.players)) {
              appendToCsv(
                "match_players.csv",
                match.players,
                [
                  "matchId",
                  "puuid",
                  "gameName",
                  "tagLine",
                  "teamId",
                  "characterId",
                  "score",
                  "kills",
                  "deaths",
                  "assists",
                ],
                (p: PlayerMatchDto) => [
                  matchInfo.matchId,
                  p.subject,
                  p.gameName || "ANONYMOUS",
                  p.tagLine || "",
                  p.teamId,
                  p.characterId,
                  p.stats ? p.stats.score : 0,
                  p.stats ? p.stats.kills : 0,
                  p.stats ? p.stats.deaths : 0,
                  p.stats ? p.stats.assists : 0,
                ],
              );
            }

            if (Array.isArray(match.roundResults)) {
              appendToCsv(
                "match_rounds.csv",
                match.roundResults,
                [
                  "matchId",
                  "roundNum",
                  "roundResult",
                  "winningTeam",
                  "bombPlanter",
                  "bombDefuser",
                ],
                (r: RoundResultDto) => [
                  matchInfo.matchId,
                  r.roundNum,
                  r.roundResult,
                  r.winningTeam,
                  r.bombPlanter || "",
                  r.bombDefuser || "",
                ],
              );

              const roundPurchases: PlayerRoundPurchase[] = [];
              match.roundResults.forEach((round) => {
                if (Array.isArray(round.playerStats)) {
                  round.playerStats.forEach((pStat) => {
                    roundPurchases.push({
                      matchId: matchInfo.matchId,
                      roundNum: round.roundNum,
                      puuid: pStat.subject,
                      score: pStat.score,
                      loadoutValue: pStat.economy
                        ? pStat.economy.loadoutValue
                        : 0,
                      weapon: pStat.economy ? pStat.economy.weapon : "",
                      armor: pStat.economy ? pStat.economy.armor : "",
                      spent: pStat.economy ? pStat.economy.spent : 0,
                      remaining: pStat.economy ? pStat.economy.remaining : 0,
                      wasAfk: pStat.wasAfk ? "YES" : "NO",
                      wasPenalized: pStat.wasPenalized ? "YES" : "NO",
                    });
                  });
                }
              });

              if (roundPurchases.length > 0) {
                appendToCsv(
                  "match_round_purchases.csv",
                  roundPurchases,
                  [
                    "matchId",
                    "roundNum",
                    "puuid",
                    "score",
                    "loadoutValue",
                    "weapon",
                    "armor",
                    "spent",
                    "remaining",
                    "wasAfk",
                    "wasPenalized",
                  ],
                  (c: PlayerRoundPurchase) => [
                    c.matchId,
                    c.roundNum,
                    c.puuid,
                    c.score,
                    c.loadoutValue,
                    c.weapon,
                    c.armor,
                    c.spent,
                    c.remaining,
                    c.wasAfk,
                    c.wasPenalized,
                  ],
                );
              }
            }
          }
        }),
      );
  }
}
