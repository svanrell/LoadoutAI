import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { Subject } from "rxjs";
import {
  ValorantHistoryService,
  SyncedPlayerProfile,
} from "./valorant-history.service";
import {
  DraftPredictionResult,
  AgentRecommendation,
  AgentMarginalImpact,
} from "./valorant-ml-engine";
import { SocketEventValidator } from "./dto/socket-events.dto";

const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^app:\/\//,
  /^file:\/\//,
];

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))
      ) {
        callback(null, true);
      } else {
        callback(new Error(`WebSocket CORS bloqueado para origen: ${origin}`));
      }
    },
  },
})
export class ValorantGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ValorantGateway.name);

  constructor(private readonly historyService: ValorantHistoryService) {}

  readonly pregameSelect$ = new Subject<{
    pregameMatchId: string;
    agentUuid: string;
  }>();
  readonly pregameLock$ = new Subject<{
    pregameMatchId: string;
    agentUuid: string;
  }>();
  readonly ingameCredits$ = new Subject<{ credits: number }>();
  readonly requestMlDraft$ = new Subject<{
    mapName?: string;
    modeName?: string;
    allies?: string[];
    client: Socket;
  }>();

  private currentStatus: string = "CLOSED";
  private extraData: Record<string, unknown> = {};
  private buyPhaseStatus: {
    available: boolean;
    time: number;
    round: number;
    scoreAlly?: number;
    scoreEnemy?: number;
  } = { available: false, time: 0, round: 0, scoreAlly: 0, scoreEnemy: 0 };

  handleConnection(client: Socket) {
    client.emit("valorant_status", {
      status: this.currentStatus,
      ...this.extraData,
    });
    client.emit("buy_phase", this.buyPhaseStatus);
  }

  updateStatus(status: string, data: Record<string, unknown> = {}) {
    this.currentStatus = status;
    this.extraData = data;
    if (this.server) {
      this.server.emit("valorant_status", {
        status,
        ...data,
      });
    }
  }

  emitBuyPhaseStatus(
    available: boolean,
    time: number,
    round: number,
    scoreAlly: number = 0,
    scoreEnemy: number = 0,
  ) {
    this.buyPhaseStatus = { available, time, round, scoreAlly, scoreEnemy };
    if (this.server) {
      this.server.emit("buy_phase", this.buyPhaseStatus);
    }
  }

  @SubscribeMessage("pregame_select")
  handlePregameSelect(client: Socket, data: unknown) {
    try {
      const validated = SocketEventValidator.validatePregameAction(
        data,
        this.extraData.pregameMatchId as string | undefined,
      );
      this.logger.log(
        `RECEIVED PREGAME_SELECT validado: ${validated.agentUuid}`,
      );
      this.pregameSelect$.next(validated);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`pregame_select rechazado: ${msg}`);
      client.emit("error_response", { event: "pregame_select", error: msg });
    }
  }

  @SubscribeMessage("pregame_lock")
  handlePregameLock(client: Socket, data: unknown) {
    try {
      const validated = SocketEventValidator.validatePregameAction(
        data,
        this.extraData.pregameMatchId as string | undefined,
      );
      this.logger.log(`RECEIVED PREGAME_LOCK validado: ${validated.agentUuid}`);
      this.pregameLock$.next(validated);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`pregame_lock rechazado: ${msg}`);
      client.emit("error_response", { event: "pregame_lock", error: msg });
    }
  }

  @SubscribeMessage("update_ingame_credits")
  handleUpdateIngameCredits(client: Socket, data: unknown) {
    try {
      const validated = SocketEventValidator.validateCredits(data);
      this.ingameCredits$.next(validated);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`update_ingame_credits rechazado: ${msg}`);
      client.emit("error_response", {
        event: "update_ingame_credits",
        error: msg,
      });
    }
  }

  @SubscribeMessage("request_ml_draft")
  handleRequestMlDraft(client: Socket, data: unknown) {
    try {
      const validated = SocketEventValidator.validateMlDraft(data);
      this.requestMlDraft$.next({ ...validated, client });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Error en request_ml_draft: ${msg}`);
      client.emit("error_response", {
        event: "request_ml_draft",
        error: msg,
      });
    }
  }

  @SubscribeMessage("request_player_profile")
  async handleRequestPlayerProfile(client: Socket, data: unknown) {
    try {
      const validated = SocketEventValidator.validatePlayerProfile(data);
      const profile = await this.historyService.getFullSyncedProfile(
        validated.puuid,
        Boolean(validated.forceRefresh),
      );
      client.emit("player_profile_result", {
        success: Boolean(profile),
        profile,
      });
    } catch (error) {
      client.emit("player_profile_result", {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  emitMlDraftResult(
    client: Socket,
    result:
      | DraftPredictionResult
      | {
          recommendations: AgentRecommendation[];
          currentSynergy: number;
          agentImpacts?: AgentMarginalImpact[];
        },
  ) {
    client.emit("ml_draft_result", result);
  }

  emitMlBuyRecommendations(data: unknown) {
    if (this.server) {
      this.server.emit("ml_buy_recommendations", data);
    }
  }

  emitPlayerProfile(profile: SyncedPlayerProfile | null) {
    if (this.server) {
      this.server.emit("player_profile_result", {
        success: Boolean(profile),
        profile,
      });
    }
  }
}
