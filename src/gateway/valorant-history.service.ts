import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { firstValueFrom } from "rxjs";

import {
  MAPS_MAP,
  QUEUES_MAP,
  TIER_NAMES,
  resolveMapName,
  resolveQueueName,
  resolveTierName,
} from "./valorant.constants";

export {
  MAPS_MAP,
  QUEUES_MAP,
  TIER_NAMES,
  resolveMapName,
  resolveQueueName,
  resolveTierName,
};

// ==========================================
// INTERFACES DE RESPUESTA DE RIOT (PD SERVICE)
// ==========================================

export interface RiotAuthCredentials {
  url: string;
  token: string;
}

export interface RiotRemoteConfig {
  pdUrl: string;
  glzUrl: string;
  headers: {
    Authorization: string;
    "X-Riot-Entitlements-JWT": string;
    "X-Riot-ClientVersion": string;
    "X-Riot-ClientPlatform": string;
  };
}

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

// ==========================================
// CONSTANTES DE HISTORIAL
// ==========================================

export const MAX_HISTORY_MONTHS = 6;
export const MAX_HISTORY_DAYS = 180;
export const MAX_HISTORY_TIME_WINDOW_MS = 180 * 24 * 60 * 60 * 1000; // Límite máximo de 6 meses

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
  private readonly lockfilePath: string;
  private readonly httpsAgent: https.Agent;

  private profileCache: Map<
    string,
    { data: SyncedPlayerProfile; timestamp: number }
  > = new Map();
  private inFlightRequests: Map<string, Promise<SyncedPlayerProfile | null>> =
    new Map();

  constructor(private readonly httpService: HttpService) {
    this.lockfilePath = path.join(
      process.env.LOCALAPPDATA || "",
      "Riot Games",
      "Riot Client",
      "Config",
      "lockfile",
    );
    this.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  // ==========================================
  // 1. CREDENCIALES Y CONFIGURACIÓN REMOTA
  // ==========================================

  public getCredentials(): RiotAuthCredentials | null {
    if (!fs.existsSync(this.lockfilePath)) return null;

    try {
      const content = fs.readFileSync(this.lockfilePath, "utf8");
      const [, , port, password, protocol] = content.split(":");
      const authBase64 = Buffer.from(`riot:${password}`).toString("base64");

      return {
        url: `${protocol}://127.0.0.1:${port}`,
        token: `Basic ${authBase64}`,
      };
    } catch (e) {
      this.logger.warn(
        `Could not read lockfile: ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
  }

  public async getRemoteConfig(): Promise<RiotRemoteConfig | null> {
    const credentials = this.getCredentials();
    if (!credentials) return null;

    try {
      const tokenRes = await firstValueFrom(
        this.httpService.get<{ accessToken: string; token: string }>(
          `${credentials.url}/entitlements/v1/token`,
          {
            headers: { Authorization: credentials.token },
            httpsAgent: this.httpsAgent,
          },
        ),
      );

      const versionRes = await firstValueFrom(
        this.httpService.get<{ data: { riotClientVersion: string } }>(
          "https://valorant-api.com/v1/version",
        ),
      );

      // Intentar auto-detectar la región desde el cliente local de Riot si no está en .env
      let region = process.env.VALORANT_REGION || "";
      if (!region) {
        try {
          const regionRes = await firstValueFrom(
            this.httpService.get<{ region?: string; webRegion?: string }>(
              `${credentials.url}/riotclient/region-locale`,
              {
                headers: { Authorization: credentials.token },
                httpsAgent: this.httpsAgent,
              },
            ),
          );
          const rawReg = (
            regionRes.data?.region ||
            regionRes.data?.webRegion ||
            ""
          ).toLowerCase();
          if (rawReg.includes("eu")) region = "eu";
          else if (rawReg.includes("na")) region = "na";
          else if (rawReg.includes("latam")) region = "latam";
          else if (rawReg.includes("br")) region = "br";
          else if (rawReg.includes("ap")) region = "ap";
          else if (rawReg.includes("kr")) region = "kr";
          else region = "eu";
        } catch {
          region = "eu";
        }
      }

      const shard = region === "latam" || region === "br" ? "na" : region;

      const glzUrl = `https://glz-${region}-1.${shard}.a.pvp.net`;
      const pdUrl = `https://pd.${shard}.a.pvp.net`;

      return {
        pdUrl,
        glzUrl,
        headers: {
          Authorization: `Bearer ${tokenRes.data.accessToken}`,
          "X-Riot-Entitlements-JWT": tokenRes.data.token,
          "X-Riot-ClientVersion": versionRes.data.data.riotClientVersion,
          "X-Riot-ClientPlatform":
            "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9",
        },
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener configuración remota: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  // ==========================================
  // 2. MÉTODOS DE LA API DE RIOT (PD SERVICE)
  // ==========================================

  public async getCurrentPlayerPuuid(): Promise<string | null> {
    const credentials = this.getCredentials();
    if (!credentials) return null;

    try {
      const res = await firstValueFrom(
        this.httpService.get<{ puuid: string }>(
          `${credentials.url}/chat/v1/session`,
          {
            headers: { Authorization: credentials.token },
            httpsAgent: this.httpsAgent,
          },
        ),
      );
      return res.data.puuid || null;
    } catch {
      return null;
    }
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

  public async getLocalPresenceData(
    puuid: string,
  ): Promise<{
    playerCardId?: string;
    accountLevel?: number;
    competitiveTier?: number;
    leaderboardPosition?: number;
  } | null> {
    const credentials = this.getCredentials();
    if (!credentials) return null;

    try {
      const res = await firstValueFrom(
        this.httpService.get<{ presences?: Array<{ puuid: string; private: string }> }>(
          `${credentials.url}/chat/v4/presences`,
          {
            headers: { Authorization: credentials.token },
            httpsAgent: this.httpsAgent,
          },
        ),
      );
      const myPresence = res.data.presences?.find((p) => p.puuid === puuid);
      if (myPresence && myPresence.private) {
        const decoded = Buffer.from(myPresence.private, "base64").toString("utf8");
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

  // ==========================================
  // 3. SINCRONIZACIÓN COMPLETA DEL PERFIL
  // ==========================================

  public async getFullSyncedProfile(
    targetPuuid?: string,
    forceRefresh = false,
  ): Promise<SyncedPlayerProfile | null> {
    const puuid = targetPuuid || (await this.getCurrentPlayerPuuid());
    if (!puuid) {
      this.logger.warn("No se pudo obtener el PUUID para sincronizar perfil.");
      return null;
    }

    // 1. Si no es un refresco forzado y está en caché reciente (< 25 segundos), devolver caché inmediatamente
    const cached = this.profileCache.get(puuid);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 25_000) {
      return cached.data;
    }

    // 2. Si ya hay una petición idéntica en vuelo para este PUUID, reutilizar la misma promesa
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
      // 1. Obtener Nombre, MMR, Lista de Partidas, Actualizaciones Competitivas, Loadout y Presencia local en paralelo
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

      const playerNameItem = namesList[0];
      const gameName = playerNameItem?.GameName || "Player";
      const tagLine = playerNameItem?.TagLine || "LIVE";

      // 2. Extraer rango y rating competitivo
      let currentTier = 0;
      let rankedRating = 0;
      let leaderboardRank = 0;

      if (mmrData?.LatestCompetitiveUpdate) {
        currentTier = mmrData.LatestCompetitiveUpdate.TierAfterUpdate || 0;
        rankedRating =
          mmrData.LatestCompetitiveUpdate.RankedRatingAfterUpdate || 0;
      } else if (mmrData?.QueueSkills?.competitive?.SeasonalInfoBySeasonID) {
        const seasons = Object.values(
          mmrData.QueueSkills.competitive.SeasonalInfoBySeasonID,
        );
        const lastSeason = seasons[seasons.length - 1];
        if (lastSeason) {
          currentTier = lastSeason.CompetitiveTier || 0;
          rankedRating = lastSeason.RankedRating || 0;
          leaderboardRank = lastSeason.LeaderboardRank || 0;
        }
      }

      // Si aún no se detecta rango, intentar extraer de la presencia local o de la última partida competitiva
      if (currentTier === 0) {
        if (localPresence?.competitiveTier && localPresence.competitiveTier > 0) {
          currentTier = localPresence.competitiveTier;
        } else if (compUpdatesRes?.Matches && compUpdatesRes.Matches.length > 0) {
          const latestComp = compUpdatesRes.Matches[0];
          if (latestComp?.TierAfterUpdate !== undefined && latestComp.TierAfterUpdate > 0) {
            currentTier = latestComp.TierAfterUpdate;
            rankedRating = latestComp.RankedRatingAfterUpdate ?? 0;
          }
        }
      }

      const rankName = resolveTierName(currentTier);

      // 3. Cargar detalles de las partidas (con límite temporal de 6 meses)
      const now = Date.now();
      const cutoffTime = now - MAX_HISTORY_TIME_WINDOW_MS;

      const matches: SyncedMatchItem[] = [];
      const historyList = historyData?.History || [];

      // Descargar detalles en paralelo (limitado a 20)
      const detailPromises = historyList
        .slice(0, 20)
        .map((h) => this.getMatchDetails(h.MatchID));
      const detailsList = await Promise.all(detailPromises);

      const agentMap: Record<string, { wins: number; total: number }> = {};
      const streak: Array<"W" | "L"> = [];
      let totalWins = 0;

      for (const match of detailsList) {
        if (!match || !match.players || !match.teams) continue;

        const matchStartTime = match.matchInfo.gameStartMillis || 0;
        // Filtrar partidas más antiguas de 6 meses
        if (matchStartTime > 0 && matchStartTime < cutoffTime) {
          continue;
        }

        const player = match.players.find((p) => p.subject === puuid);
        if (!player) continue;

        const allyTeam = match.teams.find((t) => t.teamId === player.teamId);
        const enemyTeam = match.teams.find((t) => t.teamId !== player.teamId);

        const isWin = Boolean(allyTeam?.won);
        const scoreWon = allyTeam?.roundsWon ?? 0;
        const scoreLost = enemyTeam?.roundsWon ?? 0;

        if (isWin) {
          totalWins++;
          streak.push("W");
        } else {
          streak.push("L");
        }

        // Stats del jugador
        const kills = player.stats?.kills || 0;
        const deaths = player.stats?.deaths || 0;
        const assists = player.stats?.assists || 0;
        const score = player.stats?.score || 0;
        const rounds =
          player.stats?.roundsPlayed || Math.max(1, scoreWon + scoreLost);

        const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
        const kda = `${kills} / ${deaths} / ${assists}`;
        const acs = Math.round(score / rounds);

        // Agente más jugado
        const agentId = player.characterId;
        if (agentId) {
          if (!agentMap[agentId]) {
            agentMap[agentId] = { wins: 0, total: 0 };
          }
          agentMap[agentId].total++;
          if (isWin) agentMap[agentId].wins++;
        }

        // Determinar MVP de la partida
        let isMvp = false;
        const maxScoreInMatch = Math.max(
          ...match.players.map((p) => p.stats?.score || 0),
        );
        if (score === maxScoreInMatch && score > 0) {
          isMvp = true;
        }

        // Posición/Placement en la partida (ordenado por puntuación)
        const sortedPlayers = [...match.players].sort(
          (a, b) => (b.stats?.score || 0) - (a.stats?.score || 0),
        );
        const rankIdx = sortedPlayers.findIndex((p) => p.subject === puuid);
        const placement = isMvp
          ? "MVP"
          : rankIdx >= 0
            ? `${rankIdx + 1}º`
            : "Rank";

        // Headshots y daño si roundResults existe
        let totalHeadshots = 0;
        let totalShots = 0;
        let totalDamageDealt = 0;
        const totalDamageReceived = 0;

        if (Array.isArray(match.roundResults)) {
          for (const round of match.roundResults) {
            const rPlayer = round.playerStats?.find(
              (ps) => ps.subject === puuid,
            );
            if (rPlayer && Array.isArray(rPlayer.damage)) {
              for (const dmg of rPlayer.damage) {
                totalHeadshots += dmg.headshots || 0;
                totalShots +=
                  (dmg.headshots || 0) +
                  (dmg.bodyshots || 0) +
                  (dmg.legshots || 0);
                totalDamageDealt += dmg.damage || 0;
              }
            }
          }
        }

        const hsPercent =
          totalShots > 0 ? Math.round((totalHeadshots / totalShots) * 100) : 15;
        const damageDelta =
          rounds > 0
            ? Math.round((totalDamageDealt - totalDamageReceived) / rounds)
            : 0;

        // Formato de fecha
        const dateObj = new Date(match.matchInfo.gameStartMillis || Date.now());
        const dateTitle = dateObj.toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        });
        const timeAgo = this.formatTimeAgo(dateObj.getTime());

        const rawQueue =
          match.matchInfo.queueID ||
          match.matchInfo.queueId ||
          match.matchInfo.QueueID ||
          "";
        const rawGameMode = match.matchInfo.gameMode || "";
        const rawProvisioningFlow: string =
          match.matchInfo.provisioningFlowID ||
          match.matchInfo.provisioningFlowId ||
          match.matchInfo.provisioningFlow ||
          "";
        const rawCustomGameName =
          match.matchInfo.customGameName ||
          match.matchInfo.CustomGameName ||
          "";
        const isCustomGame =
          match.matchInfo.isCustomGame ||
          rawProvisioningFlow.toLowerCase().includes("custom");

        const maxScore = Math.max(scoreWon, scoreLost);

        const modeName = resolveQueueName(
          rawQueue,
          rawGameMode,
          match.matchInfo.isRanked,
          maxScore,
          rawProvisioningFlow,
          rawCustomGameName,
          isCustomGame,
        );

        matches.push({
          id: match.matchInfo.matchId,
          isWin,
          agentId,
          mapName: resolveMapName(match.matchInfo.mapId),
          modeName,
          placement,
          isMvp,
          scoreWon,
          scoreLost,
          kd,
          kda,
          kills,
          deaths,
          assists,
          acs,
          hsPercent,
          damageDelta,
          gameStartTime: match.matchInfo.gameStartMillis,
          dateTitle,
          timeAgo,
        });
      }

      // 4. Calcular top agentes
      const topAgents: SyncedAgentStat[] = Object.entries(agentMap)
        .map(([agentId, data]) => ({
          agentId,
          matchesPlayed: data.total,
          wins: data.wins,
          losses: data.total - data.wins,
          winRate: Math.round((data.wins / data.total) * 100),
        }))
        .sort((a, b) => b.matchesPlayed - a.matchesPlayed)
        .slice(0, 3);

      const totalMatches = matches.length;
      const winRate =
        totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

      // 5. Procesar historial de actualizaciones competitivas (RR) (con límite temporal de 6 meses)
      const competitiveUpdates: SyncedCompetitiveUpdate[] = [];
      const rawCompMatches = compUpdatesRes?.Matches || [];

      for (const cu of rawCompMatches) {
        if (!cu || cu.TierAfterUpdate === undefined) continue;

        const matchStartTime = cu.MatchStartTime || 0;
        // Filtrar actualizaciones competitivas más antiguas de 6 meses
        if (matchStartTime > 0 && matchStartTime < cutoffTime) {
          continue;
        }

        const tier = cu.TierAfterUpdate;
        const tierName = resolveTierName(tier);
        const dateObj = new Date(cu.MatchStartTime || Date.now());
        const dateStr = dateObj.toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        });
        const timeAgo = this.formatTimeAgo(dateObj.getTime());

        competitiveUpdates.push({
          matchId: cu.MatchID,
          mapName: resolveMapName(cu.MapID),
          matchStartTime: cu.MatchStartTime || Date.now(),
          tier,
          tierName,
          rankedRating: cu.RankedRatingAfterUpdate ?? 0,
          rankedRatingEarned: cu.RankedRatingEarned ?? 0,
          performanceBonus: cu.RankedRatingPerformanceBonus ?? 0,
          movement: cu.CompetitiveMovement || "MOVEMENT_UNKNOWN",
          dateStr,
          timeAgo,
        });
      }

      let playerCardId =
        loadoutData?.Identity?.PlayerCardID ||
        localPresence?.playerCardId ||
        "";
      let accountLevel =
        loadoutData?.Identity?.AccountLevel ||
        localPresence?.accountLevel ||
        0;

      // Si no viene en el loadout ni en la presencia local, buscar en los detalles de las partidas recientes
      if (!playerCardId && detailsList.length > 0) {
        for (const match of detailsList) {
          const p = match?.players?.find((pl) => pl.subject === puuid);
          const foundCard =
            p?.playerCard ||
            (p as any)?.playerCardId ||
            (p as any)?.PlayerCardID;
          if (foundCard) {
            playerCardId = foundCard;
            if (!accountLevel && (p as any)?.accountLevel) {
              accountLevel = (p as any).accountLevel;
            }
            break;
          }
        }
      }

      const profile: SyncedPlayerProfile = {
        puuid,
        gameName,
        tagLine,
        region: process.env.VALORANT_REGION || "eu",
        currentTier,
        rankName,
        rankedRating,
        leaderboardRank,
        playerCardId,
        accountLevel,
        totalMatches,
        winRate,
        streak,
        topAgents,
        matches,
        competitiveUpdates,
      };

      return profile;
    } catch (error) {
      this.logger.error(
        `Error al construir perfil sincronizado: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private formatTimeAgo(timestamp: number): string {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }
}
