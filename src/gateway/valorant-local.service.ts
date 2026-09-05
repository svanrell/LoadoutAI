import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom, Subscription } from "rxjs";
import { ValorantGateway } from "./valorant.gateway";
import { resolveMapName, resolveQueueName } from "./valorant.constants";
import {
  ValorantMlEngine,
  AgentRecommendation,
  AgentMarginalImpact,
} from "./valorant-ml-engine";
import { RiotClientService } from "./services/riot-client.service";
import { RiotPregameService } from "./services/riot-pregame.service";
import {
  RiotCoregameService,
  LocalPlayerInfo,
} from "./services/riot-coregame.service";

interface ChatSessionResponse {
  puuid: string;
}

interface ValorantPrivatePresenceData {
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

interface PresencesResponse {
  presences?: Array<{
    puuid: string;
    private: string;
  }>;
}

@Injectable()
export class ValorantLocalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ValorantLocalService.name);
  private currentStatus: string = "CLOSED";
  private currentExtraData: Record<string, unknown> = {};
  private pollTimeout: NodeJS.Timeout | null = null;
  private isDestroyed: boolean = false;
  private isCheckingStatus: boolean = false;

  private allyScore: number = -1;
  private enemyScore: number = -1;
  private buyPhaseSecondsRemaining: number = 0;
  private buyPhaseInterval: NodeJS.Timeout | null = null;
  private currentCredits: number = 800;

  private lastMlDraftKey: string = "";
  private lastMlDraftResult: {
    recommendations: AgentRecommendation[];
    currentSynergy: number;
    agentImpacts?: AgentMarginalImpact[];
  } = {
    recommendations: [],
    currentSynergy: 50.0,
    agentImpacts: [],
  };

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly httpService: HttpService,
    private readonly gateway: ValorantGateway,
    private readonly riotClientService: RiotClientService,
    private readonly riotPregameService: RiotPregameService,
    private readonly riotCoregameService: RiotCoregameService,
  ) {}

  onModuleInit() {
    this.logger.log(
      "Iniciando radar local de Valorant con sondeo adaptativo y TLS seguro...",
    );
    this.scheduleNextCheck(500);

    // Escucha eventos del Frontend con manejo de errores y limpieza
    this.subscriptions.add(
      this.gateway.pregameSelect$.subscribe({
        next: async (data) => {
          try {
            await this.selectAgent(data.pregameMatchId, data.agentUuid);
          } catch (err) {
            this.logger.error("Error al procesar pregameSelect$:", err);
          }
        },
        error: (err) =>
          this.logger.error("Error en flujo pregameSelect$:", err),
      }),
    );

    this.subscriptions.add(
      this.gateway.pregameLock$.subscribe({
        next: async (data) => {
          try {
            await this.lockAgent(data.pregameMatchId, data.agentUuid);
          } catch (err) {
            this.logger.error("Error al procesar pregameLock$:", err);
          }
        },
        error: (err) => this.logger.error("Error en flujo pregameLock$:", err),
      }),
    );

    this.subscriptions.add(
      this.gateway.ingameCredits$.subscribe({
        next: (data) => {
          this.updateIngameCredits(data.credits);
        },
        error: (err) =>
          this.logger.error("Error en flujo ingameCredits$:", err),
      }),
    );

    this.subscriptions.add(
      this.gateway.requestMlDraft$.subscribe({
        next: ({ mapName, modeName, allies, client }) => {
          const map = mapName || "Ascent";
          const mode =
            modeName ||
            (this.currentExtraData?.mode as string) ||
            "competitive";
          const result = this.getMLDraftRecommendations(
            map,
            allies || [],
            mode,
          );
          this.gateway.emitMlDraftResult(client, result);
        },
        error: (err) =>
          this.logger.error("Error en flujo requestMlDraft$:", err),
      }),
    );
  }

  onModuleDestroy() {
    this.isDestroyed = true;
    this.subscriptions.unsubscribe();

    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    if (this.buyPhaseInterval) {
      clearInterval(this.buyPhaseInterval);
      this.buyPhaseInterval = null;
    }
    this.logger.log("Radar local de Valorant detenido y recursos liberados.");
  }

  private scheduleNextCheck(delayMs?: number) {
    if (this.isDestroyed) return;
    if (this.pollTimeout) clearTimeout(this.pollTimeout);

    let nextDelay = delayMs;
    if (nextDelay === undefined) {
      if (this.currentStatus === "CLOSED") {
        nextDelay = 3500;
      } else if (
        this.currentStatus === "PREGAME" ||
        this.currentStatus === "INGAME"
      ) {
        nextDelay = 1500;
      } else {
        nextDelay = 2500;
      }
    }

    this.pollTimeout = setTimeout(async () => {
      try {
        await this.checkStatus();
      } catch (error) {
        this.logger.error(
          `Error en sondeo de estado de Valorant: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        this.scheduleNextCheck();
      }
    }, nextDelay);
  }

  async selectAgent(
    pregameMatchId: string,
    agentUuid: string,
  ): Promise<boolean> {
    const remote = await this.riotClientService.getRemoteConfig();
    if (!remote) {
      this.logger.warn(
        "selectAgent falló: configuración remota no disponible.",
      );
      return false;
    }

    let matchId = pregameMatchId;
    if (!matchId || matchId === "PRESENCE_LOBBY") {
      const puuid = await this.riotClientService.getCurrentPlayerPuuid();
      if (puuid) {
        const pregameData = await this.riotPregameService.getPregameMatch(
          remote.glzUrl,
          remote.headers,
          puuid,
        );
        if (pregameData) {
          matchId = pregameData.matchId;
        }
      }
    }

    if (!matchId) {
      this.logger.error("No se puede seleccionar agente: falta pregameMatchId");
      return false;
    }

    return this.riotPregameService.selectAgent(
      remote.glzUrl,
      remote.headers,
      matchId,
      agentUuid,
    );
  }

  async lockAgent(pregameMatchId: string, agentUuid: string): Promise<boolean> {
    const remote = await this.riotClientService.getRemoteConfig();
    if (!remote) {
      this.logger.warn("lockAgent falló: configuración remota no disponible.");
      return false;
    }

    let matchId = pregameMatchId;
    if (!matchId || matchId === "PRESENCE_LOBBY") {
      const puuid = await this.riotClientService.getCurrentPlayerPuuid();
      if (puuid) {
        const pregameData = await this.riotPregameService.getPregameMatch(
          remote.glzUrl,
          remote.headers,
          puuid,
        );
        if (pregameData) {
          matchId = pregameData.matchId;
        }
      }
    }

    if (!matchId) {
      this.logger.error("No se puede bloquear agente: falta pregameMatchId");
      return false;
    }

    return this.riotPregameService.lockAgent(
      remote.glzUrl,
      remote.headers,
      matchId,
      agentUuid,
    );
  }

  private async checkStatus() {
    if (this.isCheckingStatus) return;
    this.isCheckingStatus = true;

    try {
      const credentials = this.riotClientService.getCredentials();
      if (!credentials) {
        this.updateStatus("CLOSED");
        return;
      }

      const localAgent = this.riotClientService.getLocalHttpsAgent(
        credentials.url,
      );
      const config = {
        headers: { Authorization: credentials.token },
        httpsAgent: localAgent,
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
            const remoteConfig = await this.riotClientService.getRemoteConfig();
            if (!remoteConfig) {
              throw new Error(
                "Configuración remota GLZ no disponible para pregame",
              );
            }

            const pregameData = await this.riotPregameService.getPregameMatch(
              remoteConfig.glzUrl,
              remoteConfig.headers,
              puuid,
            );

            if (pregameData) {
              const pregameMatch = pregameData.data;
              const pregameMatchId = pregameData.matchId;
              const mapPath = pregameMatch.MapID || "";
              const mapName = resolveMapName(mapPath);

              const players = pregameMatch.AllyTeam.Players.map((p) => ({
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

              const alliesAgentUuids = players
                .filter((p) => p.agentId && p.agentId !== "")
                .map((p) => p.agentId);

              const mlResult = this.getMLDraftRecommendations(
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
                mlAgentImpacts: mlResult.agentImpacts || [],
                mode,
              });
            } else {
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
          } catch (error) {
            this.logger.error(
              `Error en consulta pregame: ${error instanceof Error ? error.message : String(error)}`,
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

          let players: LocalPlayerInfo[] = [];
          try {
            const remoteConfig = await this.riotClientService.getRemoteConfig();
            if (remoteConfig) {
              const coreGameInfo =
                await this.riotCoregameService.getCoreGameTeammates(
                  remoteConfig.glzUrl,
                  remoteConfig.headers,
                  puuid,
                  presences.data.presences,
                );
              if (coreGameInfo) {
                players = coreGameInfo.players;
              }
            }
          } catch (error) {
            this.logger.error(
              `Error en consulta core-game: ${error instanceof Error ? error.message : String(error)}`,
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
            this.currentExtraData?.scoreAlly ??
            0;
          const scoreEnemy =
            privateData.partyOwnerMatchScoreEnemyTeam ??
            this.currentExtraData?.scoreEnemy ??
            0;

          if (
            this.allyScore !== Number(scoreAlly) ||
            this.enemyScore !== Number(scoreEnemy)
          ) {
            this.allyScore = Number(scoreAlly);
            this.enemyScore = Number(scoreEnemy);
            this.startBuyPhase(this.allyScore, this.enemyScore);
          }
        } else {
          this.clearBuyPhase();
          this.updateStatus("MENUS");
        }
      } else {
        this.clearBuyPhase();
        this.updateStatus("MENUS");
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
        `Cambio de estado en radar: ${newStatus} ${JSON.stringify(extraData)}`,
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
      `Nueva ronda detectada! Ronda: ${round}. Fase de compra: ${this.buyPhaseSecondsRemaining}s.`,
    );
    this.gateway.emitBuyPhaseStatus(
      true,
      this.buyPhaseSecondsRemaining,
      round,
      scoreAlly,
      scoreEnemy,
    );

    this.updateIngameCredits(this.currentCredits);

    this.buyPhaseInterval = setInterval(() => {
      this.buyPhaseSecondsRemaining--;
      if (this.buyPhaseSecondsRemaining <= 0) {
        this.logger.log(`Fase de compra terminada para ronda ${round}.`);
        this.gateway.emitBuyPhaseStatus(
          false,
          0,
          round,
          this.allyScore,
          this.enemyScore,
        );
        if (this.buyPhaseInterval) {
          clearInterval(this.buyPhaseInterval);
          this.buyPhaseInterval = null;
        }
      } else {
        this.gateway.emitBuyPhaseStatus(
          true,
          this.buyPhaseSecondsRemaining,
          round,
          this.allyScore,
          this.enemyScore,
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

  getMLDraftRecommendations(
    mapName: string,
    alliesAgentUuids: string[],
    modeName: string = "competitive",
  ): {
    recommendations: AgentRecommendation[];
    currentSynergy: number;
    agentImpacts?: AgentMarginalImpact[];
  } {
    const normalizedMap = (mapName || "Ascent").trim().toLowerCase();
    const normalizedMode = (modeName || "competitive").trim().toLowerCase();
    const sortedAllies = (alliesAgentUuids || [])
      .filter(Boolean)
      .map((u) => u.toLowerCase().trim())
      .sort()
      .join(",");
    const cacheKey = `${normalizedMap}__${normalizedMode}__${sortedAllies}`;

    if (
      this.lastMlDraftKey === cacheKey &&
      this.lastMlDraftResult.recommendations.length > 0
    ) {
      return this.lastMlDraftResult;
    }

    try {
      const mlEngine = ValorantMlEngine.getInstance();
      const prediction = mlEngine.predict(
        mapName || "Ascent",
        alliesAgentUuids || [],
        modeName || "competitive",
      );

      if (prediction && prediction.success) {
        this.lastMlDraftKey = cacheKey;
        this.lastMlDraftResult = {
          recommendations: prediction.recommendations || [],
          currentSynergy: prediction.currentSynergy || 50.0,
          agentImpacts: prediction.agentImpacts || [],
        };
        return this.lastMlDraftResult;
      }
    } catch (engineError) {
      this.logger.warn(
        `Error al calcular predicción de draft ML: ${engineError instanceof Error ? engineError.message : String(engineError)}`,
      );
    }

    return this.lastMlDraftResult;
  }
}
