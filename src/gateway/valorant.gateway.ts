import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Subject } from "rxjs";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ValorantGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

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
    allies?: string[];
    client: Socket;
  }>();

  private currentStatus: string = "CLOSED";
  private extraData: Record<string, unknown> = {};
  private buyPhaseStatus: { available: boolean; time: number; round: number } =
    { available: false, time: 0, round: 0 };

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

  emitBuyPhaseStatus(available: boolean, time: number, round: number) {
    this.buyPhaseStatus = { available, time, round };
    if (this.server) {
      this.server.emit("buy_phase", this.buyPhaseStatus);
    }
  }

  @SubscribeMessage("pregame_select")
  handlePregameSelect(
    client: Socket,
    data: { pregameMatchId?: string; agentUuid: string },
  ) {
    const pregameMatchId = data.pregameMatchId || (this.extraData.pregameMatchId as string);
    console.log("RECEIVED PREGAME_SELECT:", { pregameMatchId, agentUuid: data.agentUuid });
    this.pregameSelect$.next({ pregameMatchId, agentUuid: data.agentUuid });
  }

  @SubscribeMessage("pregame_lock")
  handlePregameLock(
    client: Socket,
    data: { pregameMatchId?: string; agentUuid: string },
  ) {
    const pregameMatchId = data.pregameMatchId || (this.extraData.pregameMatchId as string);
    console.log("RECEIVED PREGAME_LOCK:", { pregameMatchId, agentUuid: data.agentUuid });
    this.pregameLock$.next({ pregameMatchId, agentUuid: data.agentUuid });
  }

  @SubscribeMessage("update_ingame_credits")
  handleUpdateIngameCredits(client: Socket, data: { credits: number }) {
    this.ingameCredits$.next(data);
  }

  @SubscribeMessage("request_ml_draft")
  handleRequestMlDraft(
    client: Socket,
    data: { mapName?: string; allies?: string[] },
  ) {
    this.requestMlDraft$.next({ ...data, client });
  }

  emitMlDraftResult(client: Socket, result: any) {
    client.emit("ml_draft_result", result);
  }

  emitMlBuyRecommendations(data: any) {
    if (this.server) {
      this.server.emit("ml_buy_recommendations", data);
    }
  }
}
