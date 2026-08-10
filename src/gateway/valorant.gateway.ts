import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { firstValueFrom, Subject } from "rxjs";
import { ContentService } from "../valorant_api/content/content.service";
import { AgentsService } from "../valorant_api/agents/agents.service";
import { MapsService } from "../valorant_api/maps/maps.service";
import { WeaponsService } from "../valorant_api/weapons/weapons.service";

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

  private currentStatus: string = "CLOSED";
  private extraData: Record<string, unknown> = {};
  private buyPhaseStatus: { available: boolean; time: number; round: number } =
    { available: false, time: 0, round: 0 };

  constructor(
    private readonly contentService: ContentService,
    private readonly agentsService: AgentsService,
    private readonly mapsService: MapsService,
    private readonly weaponsService: WeaponsService,
  ) {}

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

  @SubscribeMessage("load_all")
  async handleLoadAll() {
    try {
      this.server.emit("loading_progress", {
        phase: "Loading content...",
        progress: 10,
      });
      const content = await firstValueFrom(this.contentService.loadContent());
      this.server.emit("loading_progress", {
        phase: "Content loaded",
        progress: 20,
      });

      this.server.emit("loading_progress", {
        phase: "Loading agents...",
        progress: 30,
      });
      const agents = await firstValueFrom(this.agentsService.loadAgents());
      this.server.emit("loading_progress", {
        phase: "Agents loaded",
        progress: 50,
      });

      this.server.emit("loading_progress", {
        phase: "Loading maps...",
        progress: 60,
      });
      const maps = await firstValueFrom(this.mapsService.loadMaps());
      this.server.emit("loading_progress", {
        phase: "Maps loaded",
        progress: 75,
      });

      this.server.emit("loading_progress", {
        phase: "Loading weapons...",
        progress: 80,
      });
      const weapons = await firstValueFrom(this.weaponsService.loadWeapons());
      this.server.emit("loading_progress", {
        phase: "Weapons loaded",
        progress: 100,
      });

      this.server.emit("data_loaded", {
        content,
        agents,
        maps,
        weapons,
        message: "All data loaded successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.server.emit("load_error", {
        message: "Failed to load data",
        error: errorMessage,
      });
    }
  }

  @SubscribeMessage("load_content")
  async handleLoadContent() {
    try {
      const content = await firstValueFrom(this.contentService.loadContent());
      this.server.emit("content_loaded", content);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.server.emit("load_error", {
        message: "Failed to load content",
        error: errorMessage,
      });
    }
  }

  @SubscribeMessage("load_agents")
  async handleLoadAgents() {
    try {
      const agents = await firstValueFrom(this.agentsService.loadAgents());
      this.server.emit("agents_loaded", agents);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.server.emit("load_error", {
        message: "Failed to load agents",
        error: errorMessage,
      });
    }
  }

  @SubscribeMessage("load_maps")
  async handleLoadMaps() {
    try {
      const maps = await firstValueFrom(this.mapsService.loadMaps());
      this.server.emit("maps_loaded", maps);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.server.emit("load_error", {
        message: "Failed to load maps",
        error: errorMessage,
      });
    }
  }

  @SubscribeMessage("load_weapons")
  async handleLoadWeapons() {
    try {
      const weapons = await firstValueFrom(this.weaponsService.loadWeapons());
      this.server.emit("weapons_loaded", weapons);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.server.emit("load_error", {
        message: "Failed to load weapons",
        error: errorMessage,
      });
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

  emitMlBuyRecommendations(data: any) {
    if (this.server) {
      this.server.emit("ml_buy_recommendations", data);
    }
  }
}
