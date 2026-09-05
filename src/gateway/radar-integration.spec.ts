import { Test, TestingModule } from "@nestjs/testing";
import { ValorantGateway } from "./valorant.gateway";
import { ValorantLocalService } from "./valorant-local.service";
import { ValorantHistoryService } from "./valorant-history.service";
import { RiotClientService } from "./services/riot-client.service";
import { RiotPresenceService } from "./services/riot-presence.service";
import { RiotPregameService } from "./services/riot-pregame.service";
import { RiotCoregameService } from "./services/riot-coregame.service";
import { EconomyAdvisorService } from "./services/economy-advisor.service";
import { Server, Socket } from "socket.io";

describe("Radar Integration & Lifecycle Suite", () => {
  let gateway: ValorantGateway;
  let localService: ValorantLocalService;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;
  let mockEconomyService: Partial<EconomyAdvisorService>;
  let mockPregameService: Partial<RiotPregameService>;

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    };

    mockSocket = {
      id: "test-socket-id-1",
      emit: jest.fn(),
    };

    mockEconomyService = {
      computeRecommendations: jest.fn().mockReturnValue({
        buy_recommendations: [
          {
            weapon: "Classic",
            shield: "Sin escudo",
            abilities: false,
            cost: 0,
            tactic: "Full Save",
            site: "Default",
            defensor: "Retake",
          },
        ],
        enemy_economy: {
          avg_credits: 4200,
          weapon: "Vandal / Phantom",
          shield: "Heavy Shields",
          type: "Full Buy",
        },
      }),
    };

    mockPregameService = {
      selectAgent: jest.fn().mockResolvedValue(true),
      lockAgent: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValorantGateway,
        ValorantLocalService,
        {
          provide: ValorantHistoryService,
          useValue: {
            getPlayerProfile: jest.fn(),
            getBatchMatchDetails: jest.fn(),
          },
        },
        {
          provide: RiotClientService,
          useValue: {
            getCredentials: jest.fn().mockReturnValue({
              port: "1234",
              token: "mock-token",
              url: "https://127.0.0.1:1234",
            }),
            getLocalPuuid: jest.fn().mockResolvedValue("test-local-puuid"),
            getRemoteConfig: jest.fn().mockResolvedValue({
              glzUrl: "https://glz.na.a.pvp.net",
              pdUrl: "https://pd.na.a.pvp.net",
              headers: { Authorization: "Bearer test-token" },
            }),
            getLocalHttpsAgent: jest.fn(),
          },
        },
        {
          provide: RiotPresenceService,
          useValue: {
            getCurrentPresence: jest.fn(),
            getRawPresences: jest.fn(),
          },
        },
        {
          provide: RiotPregameService,
          useValue: mockPregameService,
        },
        {
          provide: RiotCoregameService,
          useValue: {
            getMatchId: jest.fn(),
          },
        },
        {
          provide: EconomyAdvisorService,
          useValue: mockEconomyService,
        },
      ],
    }).compile();

    gateway = module.get<ValorantGateway>(ValorantGateway);
    localService = module.get<ValorantLocalService>(ValorantLocalService);

    gateway.server = mockServer as Server;

    localService.onModuleInit();
    if (localService["pollTimeout"]) {
      clearTimeout(localService["pollTimeout"]);
    }
  });

  afterEach(() => {
    localService.onModuleDestroy();
  });

  describe("1. Radar Status Lifecycle Transitions (CLOSED -> MENU -> PREGAME -> INGAME)", () => {
    it("should start in CLOSED status", () => {
      expect(localService.getCurrentStatus()).toBe("CLOSED");
      expect(gateway.getCurrentStatus()).toBe("CLOSED");
    });

    it("should transition to MENU and emit MENU (never MENUS)", () => {
      localService.updateStatus("MENU", { partyId: "party-1" });

      expect(localService.getCurrentStatus()).toBe("MENU");
      expect(gateway.getCurrentStatus()).toBe("MENU");
      expect(mockServer.emit).toHaveBeenCalledWith("valorant_status", {
        status: "MENU",
        partyId: "party-1",
      });
    });

    it("should transition to PREGAME with match info", () => {
      localService.updateStatus("PREGAME", {
        pregameMatchId: "match-pregame-101",
        map: "Ascent",
      });

      expect(localService.getCurrentStatus()).toBe("PREGAME");
      expect(gateway.getCurrentStatus()).toBe("PREGAME");
      expect(mockServer.emit).toHaveBeenCalledWith("valorant_status", {
        status: "PREGAME",
        pregameMatchId: "match-pregame-101",
        map: "Ascent",
      });
    });

    it("should transition to INGAME with match details", () => {
      localService.updateStatus("INGAME", {
        map: "Ascent",
        mode: "Bomb",
        scoreAlly: 3,
        scoreEnemy: 2,
      });

      expect(localService.getCurrentStatus()).toBe("INGAME");
      expect(gateway.getCurrentStatus()).toBe("INGAME");
      expect(mockServer.emit).toHaveBeenCalledWith("valorant_status", {
        status: "INGAME",
        map: "Ascent",
        mode: "Bomb",
        scoreAlly: 3,
        scoreEnemy: 2,
      });
    });

    it("should transition back to CLOSED when client disconnects", () => {
      localService.updateStatus("MENU");
      (mockServer.emit as jest.Mock).mockClear();
      localService.updateStatus("CLOSED");

      expect(localService.getCurrentStatus()).toBe("CLOSED");
      expect(gateway.getCurrentStatus()).toBe("CLOSED");
      expect(mockServer.emit).toHaveBeenCalledWith("valorant_status", {
        status: "CLOSED",
      });
    });
  });

  describe("2. Pregame Select & Lock Client Socket Callbacks", () => {
    const validAgentUuid = "add6443a-41bd-e414-f6ad-e58d267f4e95"; // Jett
    const testMatchId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

    it("should reject pregame_select if status is not PREGAME", () => {
      localService.updateStatus("MENU");

      gateway.handlePregameSelect(mockSocket as Socket, {
        agentUuid: validAgentUuid,
        pregameMatchId: testMatchId,
      });

      expect(mockSocket.emit).toHaveBeenCalledWith("error_response", {
        event: "pregame_select",
        error: "Acción no permitida: el cliente no está en fase PREGAME.",
        code: "INVALID_PHASE",
      });
    });

    it("should execute selectAgent and return pregame_action_result on success", async () => {
      localService.updateStatus("PREGAME", { pregameMatchId: testMatchId });

      gateway.handlePregameSelect(mockSocket as Socket, {
        agentUuid: validAgentUuid,
        pregameMatchId: testMatchId,
      });

      // Allow rxjs subject and async promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockPregameService.selectAgent).toHaveBeenCalledWith(
        "https://glz.na.a.pvp.net",
        { Authorization: "Bearer test-token" },
        testMatchId,
        validAgentUuid,
      );
      expect(mockSocket.emit).toHaveBeenCalledWith("pregame_action_result", {
        success: true,
        event: "pregame_select",
        agentUuid: validAgentUuid,
        pregameMatchId: testMatchId,
      });
    });

    it("should return error_response when Riot client rejects selectAgent", async () => {
      (mockPregameService.selectAgent as jest.Mock).mockResolvedValueOnce(false);
      localService.updateStatus("PREGAME", { pregameMatchId: testMatchId });

      gateway.handlePregameSelect(mockSocket as Socket, {
        agentUuid: validAgentUuid,
        pregameMatchId: testMatchId,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockSocket.emit).toHaveBeenCalledWith("error_response", {
        event: "pregame_select",
        error:
          "El cliente Riot rechazó la selección del agente o no está disponible.",
        code: "RIOT_REJECTED",
      });
    });

    it("should execute lockAgent and return pregame_action_result on success", async () => {
      localService.updateStatus("PREGAME", { pregameMatchId: testMatchId });

      gateway.handlePregameLock(mockSocket as Socket, {
        agentUuid: validAgentUuid,
        pregameMatchId: testMatchId,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockPregameService.lockAgent).toHaveBeenCalledWith(
        "https://glz.na.a.pvp.net",
        { Authorization: "Bearer test-token" },
        testMatchId,
        validAgentUuid,
      );
      expect(mockSocket.emit).toHaveBeenCalledWith("pregame_action_result", {
        success: true,
        event: "pregame_lock",
        agentUuid: validAgentUuid,
        pregameMatchId: testMatchId,
      });
    });

    it("should return error_response when lockAgent fails with exception", async () => {
      (mockPregameService.lockAgent as jest.Mock).mockRejectedValueOnce(
        new Error("Riot Lock Network Timeout"),
      );
      localService.updateStatus("PREGAME", { pregameMatchId: testMatchId });

      gateway.handlePregameLock(mockSocket as Socket, {
        agentUuid: validAgentUuid,
        pregameMatchId: testMatchId,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockSocket.emit).toHaveBeenCalledWith("error_response", {
        event: "pregame_lock",
        error: "Riot Lock Network Timeout",
        code: "ACTION_FAILED",
      });
    });
  });

  describe("3. Ingame Economy ML Recommendations Producer & Cost 0 Support", () => {
    it("should produce ml_buy_recommendations when credits are updated", async () => {
      localService.updateStatus("INGAME");

      await localService.updateIngameCredits(800);

      expect(mockEconomyService.computeRecommendations).toHaveBeenCalledWith(
        800,
        1,
        0,
        0,
      );

      expect(mockServer.emit).toHaveBeenCalledWith("ml_buy_recommendations", {
        buy_recommendations: [
          {
            weapon: "Classic",
            shield: "Sin escudo",
            abilities: false,
            cost: 0,
            tactic: "Full Save",
            site: "Default",
            defensor: "Retake",
          },
        ],
        enemy_economy: {
          avg_credits: 4200,
          weapon: "Vandal / Phantom",
          shield: "Heavy Shields",
          type: "Full Buy",
        },
      });
    });

    it("should handle cost 0 recommendation correctly without throwing or falling back", async () => {
      (mockEconomyService.computeRecommendations as jest.Mock).mockReturnValueOnce({
        buy_recommendations: [
          {
            weapon: "Classic",
            shield: "Sin escudo",
            abilities: false,
            cost: 0,
            tactic: "Full Save",
            site: "A",
            defensor: "Aggressive",
          },
        ],
        enemy_economy: {
          avg_credits: 1900,
          weapon: "Spectre / Marshal",
          shield: "Light Shields",
          type: "Half Buy",
        },
      });

      localService.updateStatus("INGAME");
      await localService.updateIngameCredits(1200);

      expect(mockServer.emit).toHaveBeenCalledWith("ml_buy_recommendations", {
        buy_recommendations: [
          {
            weapon: "Classic",
            shield: "Sin escudo",
            abilities: false,
            cost: 0,
            tactic: "Full Save",
            site: "A",
            defensor: "Aggressive",
          },
        ],
        enemy_economy: {
          avg_credits: 1900,
          weapon: "Spectre / Marshal",
          shield: "Light Shields",
          type: "Half Buy",
        },
      });
    });
  });
});
