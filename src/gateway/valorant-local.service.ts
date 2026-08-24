import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ValorantGateway } from "./valorant.gateway";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { exec } from "child_process";
import { promisify } from "util";
import { firstValueFrom } from "rxjs";

const execPromise = promisify(exec);

const MAPS_MAP: Record<string, string> = {
  // Mapas Estándar
  "/Game/Maps/Ascent/Ascent": "Ascent",
  "/Game/Maps/Bonsai/Bonsai": "Split",
  "/Game/Maps/Canyon/Canyon": "Fracture",
  "/Game/Maps/Duality/Duality": "Bind",
  "/Game/Maps/Foxtrot/Foxtrot": "Breeze",
  "/Game/Maps/Jam/Jam": "Lotus",
  "/Game/Maps/Infinity/Infinity": "Abyss",
  "/Game/Maps/Jamboree/Jamboree": "Abyss",
  "/Game/Maps/Pitt/Pitt": "Pearl",
  "/Game/Maps/Port/Port": "Icebox",
  "/Game/Maps/Juliett/Juliett": "Sunset",
  "/Game/Maps/Rook/Rook": "Corrode",
  "/Game/Maps/Triad/Triad": "Haven",
  "/Game/Maps/Plummet/Plummet": "Summit",
  // Mapas Team Deathmatch (HURM)
  "/Game/Maps/Kasbah/Kasbah": "Kasbah",
  "/Game/Maps/HURM/HURM_Bowl/HURM_Bowl": "Kasbah",
  "/Game/Maps/Piazza/Piazza": "Piazza",
  "/Game/Maps/HURM/HURM_Yard/HURM_Yard": "Piazza",
  "/Game/Maps/District/District": "District",
  "/Game/Maps/HURM/HURM_Alley/HURM_Alley": "District",
  "/Game/Maps/Drift/Drift": "Drift",
  "/Game/Maps/HURM/HURM_Helix/HURM_Helix": "Drift",
  "/Game/Maps/HURM/HURM_HighTide/HURM_HighTide": "Glitch",
  // Campo de tiro / The Range
  "/Game/Maps/Poveglia/Range": "The Range",
  "/Game/Maps/PovegliaV2/RangeV2": "The Range",
};

const QUEUES_MAP: Record<string, string> = {
  unrated: "Unrated",
  competitive: "Competitive",
  swiftplay: "Swiftplay",
  spikerush: "Spike Rush",
  deathmatch: "Deathmatch",
  hurm: "Team Deathmatch",
  ggteam: "Escalation",
  onefa: "Replication",
  snowball: "Snowball Fight",
  newmap: "New Map",
  premier: "Premier",
  "premier-tournament": "Premier Tournament",
  seeding: "Seeding",
  custom: "Custom Game",
};

export function resolveMapName(mapPath: string): string {
  if (!mapPath) return "Ascent";
  if (MAPS_MAP[mapPath]) return MAPS_MAP[mapPath];

  // Buscar coincidencia parcial insensible a mayúsculas
  const lower = mapPath.toLowerCase();
  for (const [key, name] of Object.entries(MAPS_MAP)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return name;
    }
  }

  const parts = mapPath.split("/").filter(Boolean);
  const lastPart = parts.length > 0 ? parts[parts.length - 1] : "Ascent";
  const reconstructed = `/Game/Maps/${lastPart}/${lastPart}`;
  if (MAPS_MAP[reconstructed]) return MAPS_MAP[reconstructed];

  return lastPart;
}

export function resolveQueueName(queueId: string): string {
  if (!queueId) return "Custom Game";
  const lower = queueId.toLowerCase();
  if (QUEUES_MAP[lower]) return QUEUES_MAP[lower];
  return lower
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface ChatSessionResponse {
  puuid: string;
}

interface Presence {
  puuid: string;
  private: string;
}

interface PresencesResponse {
  presences?: Presence[];
}

interface ValorantPrivatePresenceData {
  sessionLoopState?: string;
  partyId?: string;
  matchPresenceData?: {
    sessionLoopState?: string;
    matchMap?: string;
    queueId?: string;
  };
  partyPresenceData?: {
    partyOwnerSessionLoopState?: string;
    partyOwnerMatchScoreAllyTeam?: number;
    partyOwnerMatchScoreEnemyTeam?: number;
  };
  partyOwnerMatchScoreAllyTeam?: number;
  partyOwnerMatchScoreEnemyTeam?: number;
}

interface PregamePlayerResponse {
  Subject: string;
  MatchID: string;
  Version: number;
}

interface PregamePlayer {
  Subject: string;
  CharacterID: string;
  CharacterSelectionState: string; // "" | "selected" | "locked"
  PregamePlayerState: string;
  CompetitiveTier: number;
  PlayerIdentity?: {
    Subject: string;
    PlayerCardID: string;
    PlayerTitleID: string;
    AccountLevel: number;
    PreferredLevelBorderID: string;
    Incognito: boolean;
    HideAccountLevel: boolean;
  };
}

interface PregameMatchResponse {
  ID: string;
  Version: number;
  MapID: string;
  AllyTeam: {
    TeamID: string;
    Players: PregamePlayer[];
  };
}

interface EntitlementsTokenResponse {
  accessToken: string;
  entitlements: unknown[];
  token: string;
}

interface ValorantVersionResponse {
  status: number;
  data: {
    riotClientVersion: string;
  };
}

interface CoreGamePlayerResponse {
  Subject: string;
  MatchID: string;
}

interface CoreGamePlayer {
  Subject: string;
  TeamID: string;
  CharacterID: string;
  PlayerIdentity?: {
    AccountLevel: number;
    PlayerCardID: string;
  };
}

interface CoreGameMatchResponse {
  MatchID: string;
  Players: CoreGamePlayer[];
}

@Injectable()
export class ValorantLocalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ValorantLocalService.name);
  private readonly lockfilePath: string;
  private readonly httpsAgent: https.Agent;
  private currentStatus: string = "CLOSED";
  private currentExtraData: Record<string, unknown> = {};
  private intervalId: NodeJS.Timeout;
  private allyScore: number = -1;
  private enemyScore: number = -1;
  private buyPhaseSecondsRemaining: number = 0;
  private buyPhaseInterval: NodeJS.Timeout | null = null;
  private currentCredits: number = 800;
  private isCheckingStatus: boolean = false;
  private isPredicting: boolean = false;
  private lastMlDraftKey: string = "";
  private lastMlDraftResult: {
    recommendations: any[];
    currentSynergy: number;
  } = {
    recommendations: [],
    currentSynergy: 50.0,
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly gateway: ValorantGateway,
  ) {
    this.lockfilePath = path.join(
      process.env.LOCALAPPDATA || "",
      "Riot Games",
      "Riot Client",
      "Config",
      "lockfile",
    );
    this.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  onModuleInit() {
    this.logger.log("Starting Valorant radar...");
    this.intervalId = setInterval(() => {
      void this.checkStatus();
    }, 2000);

    this.gateway.pregameSelect$.subscribe(async (data) => {
      await this.selectAgent(data.pregameMatchId, data.agentUuid);
    });

    this.gateway.pregameLock$.subscribe(async (data) => {
      await this.lockAgent(data.pregameMatchId, data.agentUuid);
    });

    this.gateway.ingameCredits$.subscribe((data) => {
      this.updateIngameCredits(data.credits);
    });

    this.gateway.requestMlDraft$.subscribe(
      async ({ mapName, allies, client }) => {
        const map = mapName || "Ascent";
        const result = await this.getMLDraftRecommendations(map, allies || []);
        this.gateway.emitMlDraftResult(client, result);
      },
    );
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.log("Valorant radar stopped.");
    }
    if (this.buyPhaseInterval) {
      clearInterval(this.buyPhaseInterval);
    }
  }

  private getCredentials() {
    if (!fs.existsSync(this.lockfilePath)) return null;

    const content = fs.readFileSync(this.lockfilePath, "utf8");
    const [, , port, password, protocol] = content.split(":");
    const authBase64 = Buffer.from(`riot:${password}`).toString("base64");

    return {
      url: `${protocol}://127.0.0.1:${port}`,
      token: `Basic ${authBase64}`,
    };
  }

  private async getRemoteConfig() {
    const credentials = this.getCredentials();
    if (!credentials) return null;

    const config = {
      headers: { Authorization: credentials.token },
      httpsAgent: this.httpsAgent,
    };

    try {
      const tokenRes = await firstValueFrom(
        this.httpService.get<EntitlementsTokenResponse>(
          `${credentials.url}/entitlements/v1/token`,
          config,
        ),
      );
      const accessToken = tokenRes.data.accessToken;
      const entitlementsToken = tokenRes.data.token;

      const versionRes = await firstValueFrom(
        this.httpService.get<ValorantVersionResponse>(
          "https://valorant-api.com/v1/version",
        ),
      );
      const clientVersion = versionRes.data.data.riotClientVersion;

      const region = process.env.VALORANT_REGION || "eu";
      const shard = region === "latam" || region === "br" ? "na" : region;
      const glzUrl = `https://glz-${region}-1.${shard}.a.pvp.net`;

      return {
        glzUrl,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Riot-Entitlements-JWT": entitlementsToken,
          "X-Riot-ClientVersion": clientVersion,
          "X-Riot-ClientPlatform":
            "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9",
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting remote config: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async selectAgent(
    pregameMatchId: string,
    agentUuid: string,
  ): Promise<boolean> {
    const remote = await this.getRemoteConfig();
    if (!remote) return false;

    let matchId = pregameMatchId;
    if (!matchId) {
      const credentials = this.getCredentials();
      if (credentials) {
        try {
          const session = await firstValueFrom(
            this.httpService.get<ChatSessionResponse>(
              `${credentials.url}/chat/v1/session`,
              {
                headers: { Authorization: credentials.token },
                httpsAgent: this.httpsAgent,
              },
            ),
          );
          const puuid = session.data.puuid;
          const pregamePlayer = await firstValueFrom(
            this.httpService.get<PregamePlayerResponse>(
              `${remote.glzUrl}/pregame/v1/players/${puuid}`,
              { headers: remote.headers },
            ),
          );
          matchId = pregamePlayer.data.MatchID;
        } catch (e) {
          this.logger.warn(
            `Could not resolve matchId automatically: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    }

    if (!matchId) {
      this.logger.error("Cannot select agent: missing pregameMatchId");
      return false;
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          `${remote.glzUrl}/pregame/v1/matches/${matchId}/select/${agentUuid}`,
          {},
          { headers: remote.headers },
        ),
      );
      this.logger.log(
        `Selected agent ${agentUuid} in pregame match ${matchId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error selecting agent: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  async lockAgent(pregameMatchId: string, agentUuid: string): Promise<boolean> {
    const remote = await this.getRemoteConfig();
    if (!remote) return false;

    let matchId = pregameMatchId;
    if (!matchId) {
      const credentials = this.getCredentials();
      if (credentials) {
        try {
          const session = await firstValueFrom(
            this.httpService.get<ChatSessionResponse>(
              `${credentials.url}/chat/v1/session`,
              {
                headers: { Authorization: credentials.token },
                httpsAgent: this.httpsAgent,
              },
            ),
          );
          const puuid = session.data.puuid;
          const pregamePlayer = await firstValueFrom(
            this.httpService.get<PregamePlayerResponse>(
              `${remote.glzUrl}/pregame/v1/players/${puuid}`,
              { headers: remote.headers },
            ),
          );
          matchId = pregamePlayer.data.MatchID;
        } catch (e) {
          this.logger.warn(
            `Could not resolve matchId automatically: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    }

    if (!matchId) {
      this.logger.error("Cannot lock agent: missing pregameMatchId");
      return false;
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          `${remote.glzUrl}/pregame/v1/matches/${matchId}/lock/${agentUuid}`,
          {},
          { headers: remote.headers },
        ),
      );
      this.logger.log(`Locked agent ${agentUuid} in pregame match ${matchId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error locking agent: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async checkStatus() {
    if (this.isCheckingStatus) return;
    this.isCheckingStatus = true;

    try {
      const credentials = this.getCredentials();

      if (!credentials) {
        this.updateStatus("CLOSED");
        return;
      }

      const config = {
        headers: { Authorization: credentials.token },
        httpsAgent: this.httpsAgent,
      };

      const session = await firstValueFrom(
        this.httpService.get<ChatSessionResponse>(
          `${credentials.url}/chat/v1/session`,
          config,
        ),
      );
      const puuid = session.data.puuid;

      const presences = await firstValueFrom(
        this.httpService.get<PresencesResponse>(
          `${credentials.url}/chat/v4/presences`,
          config,
        ),
      );

      const myPresence = presences.data.presences?.find(
        (p) => p.puuid === puuid,
      );

      if (myPresence && myPresence.private) {
        const decodedJson = Buffer.from(myPresence.private, "base64").toString(
          "utf8",
        );
        const privateData = JSON.parse(
          decodedJson,
        ) as ValorantPrivatePresenceData;

        const loopState =
          privateData.matchPresenceData?.sessionLoopState ||
          privateData.partyPresenceData?.partyOwnerSessionLoopState ||
          privateData.sessionLoopState;

        if (loopState === "PREGAME") {
          this.clearBuyPhase();
          const matchId = privateData.partyId || "PRESENCE_LOBBY";
          try {
            // 1. Obtener tokens de la API local
            const tokenRes = await firstValueFrom(
              this.httpService.get<EntitlementsTokenResponse>(
                `${credentials.url}/entitlements/v1/token`,
                config,
              ),
            );
            const accessToken = tokenRes.data.accessToken;
            const entitlementsToken = tokenRes.data.token;

            // 2. Obtener la versión actual del juego
            const versionRes = await firstValueFrom(
              this.httpService.get<ValorantVersionResponse>(
                "https://valorant-api.com/v1/version",
              ),
            );
            const clientVersion = versionRes.data.data.riotClientVersion;

            // 3. Configurar URL y headers para los servidores remotos GLZ
            const region = process.env.VALORANT_REGION || "eu";
            const shard = region === "latam" || region === "br" ? "na" : region;
            const glzUrl = `https://glz-${region}-1.${shard}.a.pvp.net`;

            const remoteConfig = {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Riot-Entitlements-JWT": entitlementsToken,
                "X-Riot-ClientVersion": clientVersion,
                "X-Riot-ClientPlatform":
                  "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9",
              },
            };

            // 4. Buscar el MatchID del pregame del jugador
            const pregamePlayer = await firstValueFrom(
              this.httpService.get<PregamePlayerResponse>(
                `${glzUrl}/pregame/v1/players/${puuid}`,
                remoteConfig,
              ),
            );
            const pregameMatchId = pregamePlayer.data.MatchID;

            // 5. Obtener los detalles de la fase de selección
            const pregameMatch = await firstValueFrom(
              this.httpService.get<PregameMatchResponse>(
                `${glzUrl}/pregame/v1/matches/${pregameMatchId}`,
                remoteConfig,
              ),
            );

            const mapPath = pregameMatch.data.MapID || "";
            const mapName = resolveMapName(mapPath);

            const players = pregameMatch.data.AllyTeam.Players.map((p) => ({
              puuid: p.Subject,
              agentId: p.CharacterID,
              state: p.CharacterSelectionState,
              level: p.PlayerIdentity?.HideAccountLevel
                ? null
                : p.PlayerIdentity?.AccountLevel,
              rank: p.CompetitiveTier,
              playerCardId: p.PlayerIdentity?.PlayerCardID,
            }));

            const queueId = privateData.matchPresenceData?.queueId || "";
            const mode = resolveQueueName(queueId);

            // Obtener agentes bloqueados o seleccionados por el equipo
            const alliesAgentUuids = players
              .filter((p) => p.agentId && p.agentId !== "")
              .map((p) => p.agentId);

            // Inferencia de Machine Learning en tiempo real
            const mlResult = await this.getMLDraftRecommendations(
              mapName,
              alliesAgentUuids,
            );

            this.updateStatus("PREGAME", {
              matchId,
              pregameMatchId,
              players,
              mapName,
              myPuuid: puuid,
              mlDraftPicks: mlResult.recommendations,
              mlSynergyWinRate: mlResult.currentSynergy,
              mode,
            });
          } catch (error) {
            this.logger.error(
              `Error querying pregame selection details: ${error instanceof Error ? error.message : String(error)}`,
            );
            const queueId = privateData.matchPresenceData?.queueId || "";
            const mode = resolveQueueName(queueId);
            this.updateStatus("PREGAME", {
              matchId,
              myPuuid: puuid,
              mode,
              mlDraftPicks: [],
              mlSynergyWinRate: 50.0,
            });
          }
        } else if (loopState === "INGAME") {
          const mapPath = privateData.matchPresenceData?.matchMap || "";
          const queueId = privateData.matchPresenceData?.queueId || "";
          const mapName = resolveMapName(mapPath);
          const mode = resolveQueueName(queueId);

          let players: any[] = [];
          try {
            const tokenRes = await firstValueFrom(
              this.httpService.get<EntitlementsTokenResponse>(
                `${credentials.url}/entitlements/v1/token`,
                config,
              ),
            );
            const accessToken = tokenRes.data.accessToken;
            const entitlementsToken = tokenRes.data.token;

            const versionRes = await firstValueFrom(
              this.httpService.get<ValorantVersionResponse>(
                "https://valorant-api.com/v1/version",
              ),
            );
            const clientVersion = versionRes.data.data.riotClientVersion;

            const region = process.env.VALORANT_REGION || "eu";
            const shard = region === "latam" || region === "br" ? "na" : region;
            const glzUrl = `https://glz-${region}-1.${shard}.a.pvp.net`;

            const remoteConfig = {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Riot-Entitlements-JWT": entitlementsToken,
                "X-Riot-ClientVersion": clientVersion,
                "X-Riot-ClientPlatform":
                  "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9",
              },
            };

            const coregamePlayer = await firstValueFrom(
              this.httpService.get<CoreGamePlayerResponse>(
                `${glzUrl}/core-game/v1/players/${puuid}`,
                remoteConfig,
              ),
            );
            const coregameMatchId = coregamePlayer.data.MatchID;

            const coregameMatch = await firstValueFrom(
              this.httpService.get<CoreGameMatchResponse>(
                `${glzUrl}/core-game/v1/matches/${coregameMatchId}`,
                remoteConfig,
              ),
            );

            const myPlayerInGame = coregameMatch.data.Players.find(
              (p) => p.Subject === puuid,
            );
            const myTeamId = myPlayerInGame ? myPlayerInGame.TeamID : null;

            const teammatePlayers = coregameMatch.data.Players.filter(
              (p) => p.TeamID === myTeamId,
            );

            players = teammatePlayers.map((p) => {
              const playerPresence = presences.data.presences?.find(
                (presence) => presence.puuid === p.Subject,
              );
              let rank = 0;
              if (playerPresence && playerPresence.private) {
                try {
                  const decoded = Buffer.from(
                    playerPresence.private,
                    "base64",
                  ).toString("utf8");
                  const presenceData = JSON.parse(decoded);
                  rank = presenceData.competitiveTier || 0;
                } catch {
                  rank = 0;
                }
              }

              return {
                puuid: p.Subject,
                agentId: p.CharacterID,
                state: "locked",
                level: p.PlayerIdentity?.AccountLevel || null,
                rank: rank,
                playerCardId: p.PlayerIdentity?.PlayerCardID,
              };
            });
          } catch (error) {
            this.logger.error(
              `Error querying core-game match details: ${error instanceof Error ? error.message : String(error)}`,
            );
          }

          this.updateStatus("INGAME", {
            mapName,
            mode,
            players,
            myPuuid: puuid,
          });

          const scoreAlly =
            privateData.partyOwnerMatchScoreAllyTeam ??
            privateData.partyPresenceData?.partyOwnerMatchScoreAllyTeam ??
            0;
          const scoreEnemy =
            privateData.partyOwnerMatchScoreEnemyTeam ??
            privateData.partyPresenceData?.partyOwnerMatchScoreEnemyTeam ??
            0;

          if (this.allyScore === -1 && this.enemyScore === -1) {
            this.allyScore = scoreAlly;
            this.enemyScore = scoreEnemy;
            this.startBuyPhase(scoreAlly, scoreEnemy);
          } else if (
            this.allyScore !== scoreAlly ||
            this.enemyScore !== scoreEnemy
          ) {
            this.allyScore = scoreAlly;
            this.enemyScore = scoreEnemy;
            this.startBuyPhase(scoreAlly, scoreEnemy);
          }
        } else {
          this.clearBuyPhase();
          const queueId = privateData.matchPresenceData?.queueId || "";
          const mode = resolveQueueName(queueId);
          this.updateStatus("MENU", { mode });
        }
      } else {
        this.clearBuyPhase();
        this.updateStatus("MENU");
      }
    } catch {
      this.clearBuyPhase();
      this.updateStatus("CLOSED");
    } finally {
      this.isCheckingStatus = false;
    }
  }

  private updateStatus(
    newStatus: string,
    extraData: Record<string, unknown> = {},
  ) {
    const statusChanged = this.currentStatus !== newStatus;
    const dataChanged =
      JSON.stringify(this.currentExtraData) !== JSON.stringify(extraData);

    if (statusChanged || dataChanged) {
      this.currentStatus = newStatus;
      this.currentExtraData = extraData;
      this.logger.log(
        `Status or details changed: ${newStatus} ${JSON.stringify(extraData)}`,
      );

      this.gateway.updateStatus(newStatus, extraData);
    }
  }

  private startBuyPhase(scoreAlly: number, scoreEnemy: number) {
    if (this.buyPhaseInterval) {
      clearInterval(this.buyPhaseInterval);
      this.buyPhaseInterval = null;
    }

    const round = scoreAlly + scoreEnemy + 1;
    const isSpecialRound = round === 1 || round === 13 || round >= 25;
    this.buyPhaseSecondsRemaining = isSpecialRound ? 45 : 30;

    this.logger.log(
      `New round detected! Round: ${round}. Starting buy phase of ${this.buyPhaseSecondsRemaining} seconds.`,
    );
    this.gateway.emitBuyPhaseStatus(true, this.buyPhaseSecondsRemaining, round);

    // Automatically trigger ML prediction for the new round
    void this.updateIngameCredits(this.currentCredits);

    this.buyPhaseInterval = setInterval(() => {
      this.buyPhaseSecondsRemaining--;
      if (this.buyPhaseSecondsRemaining <= 0) {
        this.logger.log(`Buy phase ended for round ${round}.`);
        this.gateway.emitBuyPhaseStatus(false, 0, round);
        if (this.buyPhaseInterval) {
          clearInterval(this.buyPhaseInterval);
          this.buyPhaseInterval = null;
        }
      } else {
        this.gateway.emitBuyPhaseStatus(
          true,
          this.buyPhaseSecondsRemaining,
          round,
        );
      }
    }, 1000);
  }

  private clearBuyPhase() {
    this.allyScore = -1;
    this.enemyScore = -1;
    if (this.buyPhaseInterval) {
      clearInterval(this.buyPhaseInterval);
      this.buyPhaseInterval = null;
      this.gateway.emitBuyPhaseStatus(false, 0, 0);
    }
  }

  updateIngameCredits(credits: number) {
    this.currentCredits = credits;
  }

  async getMLDraftRecommendations(
    mapName: string,
    alliesAgentUuids: string[],
  ): Promise<{ recommendations: any[]; currentSynergy: number }> {
    const normalizedMap = (mapName || "Ascent").trim().toLowerCase();
    const sortedAllies = (alliesAgentUuids || [])
      .filter(Boolean)
      .map((u) => u.toLowerCase().trim())
      .sort()
      .join(",");
    const cacheKey = `${normalizedMap}__${sortedAllies}`;

    // Si la composición y el mapa no han cambiado, reutilizar el resultado instantáneamente
    if (
      this.lastMlDraftKey === cacheKey &&
      this.lastMlDraftResult.recommendations.length > 0
    ) {
      return this.lastMlDraftResult;
    }

    // Evitar ejecuciones de Python simultáneas que saturen la CPU
    if (this.isPredicting) {
      return this.lastMlDraftResult;
    }

    this.isPredicting = true;

    try {
      const alliesArg = alliesAgentUuids.filter(Boolean).join(",") || "none";

      const pythonPath = path.join(
        process.cwd(),
        ".venv",
        "Scripts",
        "python.exe",
      );
      const scriptPath = path.join(
        process.cwd(),
        "src",
        "machine_learning",
        "predict.py",
      );

      // Priorizar el intérprete de Python del entorno virtual en desarrollo
      let cmd: string;
      if (fs.existsSync(pythonPath) && fs.existsSync(scriptPath)) {
        cmd = `"${pythonPath}" "${scriptPath}" --map "${mapName}" --allies "${alliesArg}"`;
      } else {
        const electronResources =
          process.env.ELECTRON_RESOURCES_PATH ||
          (process as any).resourcesPath ||
          "";
        const possibleExePaths = [
          path.join(electronResources, "bin", "predict.exe"),
          path.join(electronResources, "resources", "bin", "predict.exe"),
          path.join(process.cwd(), "resources", "bin", "predict.exe"),
          path.join(
            process.cwd(),
            "resources",
            "app.asar.unpacked",
            "resources",
            "bin",
            "predict.exe",
          ),
          path.join(__dirname, "..", "..", "resources", "bin", "predict.exe"),
          path.join(
            __dirname,
            "..",
            "..",
            "..",
            "resources",
            "bin",
            "predict.exe",
          ),
          path.join(__dirname, "..", "..", "..", "bin", "predict.exe"),
        ];
        const standaloneExe = possibleExePaths.find((candidatePath) =>
          fs.existsSync(candidatePath),
        );

        if (standaloneExe) {
          cmd = `"${standaloneExe}" --map "${mapName}" --allies "${alliesArg}"`;
        } else {
          cmd = `python "${scriptPath}" --map "${mapName}" --allies "${alliesArg}"`;
        }
      }

      const { stdout } = await execPromise(cmd, { timeout: 10000 });
      const parsed = JSON.parse(stdout.trim());
      if (parsed && parsed.success) {
        this.lastMlDraftKey = cacheKey;
        this.lastMlDraftResult = {
          recommendations: parsed.recommendations || [],
          currentSynergy: parsed.currentSynergy || 0.0,
        };
        return this.lastMlDraftResult;
      }
    } catch (error) {
      this.logger.warn(
        `ML Draft prediction failed or timed out: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.isPredicting = false;
    }
    return this.lastMlDraftResult;
  }
}
