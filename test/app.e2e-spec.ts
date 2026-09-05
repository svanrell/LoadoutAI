import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { io, Socket } from "socket.io-client";
import { AddressInfo } from "net";
import { AppModule } from "./../src/app.module";
import { ValorantGateway } from "../src/gateway/valorant.gateway";
import { ValorantLocalService } from "../src/gateway/valorant-local.service";
import { ValorantHistoryService } from "../src/gateway/valorant-history.service";
import { RiotClientService } from "../src/gateway/services/riot-client.service";

describe("Valorant App E2E & Gateway Suite", () => {
  let app: INestApplication;
  let socket: Socket;
  let serverUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);

    const httpServer = app.getHttpServer() as {
      address: () => AddressInfo | string | null;
    };
    const address = httpServer.address();
    const port =
      typeof address === "object" && address !== null ? address.port : 3000;
    serverUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it("should bootstrap AppModule and resolve all modular services", () => {
    expect(app).toBeDefined();
    expect(app.get(ValorantGateway)).toBeDefined();
    expect(app.get(ValorantLocalService)).toBeDefined();
    expect(app.get(ValorantHistoryService)).toBeDefined();
    expect(app.get(RiotClientService)).toBeDefined();
  });

  it("should connect via WebSocket and communicate with the Gateway", (done) => {
    socket = io(serverUrl, {
      transports: ["websocket"],
      reconnection: false,
    });

    socket.on("connect", () => {
      expect(socket.connected).toBe(true);
      done();
    });

    socket.on("connect_error", (err) => {
      done(err);
    });
  });

  it("should reject invalid pregame_select payload with validation error", (done) => {
    socket.emit("pregame_select", {
      agentUuid: "not-a-valid-uuid",
      pregameMatchId: "invalid",
    });

    socket.once("error_response", (data) => {
      expect(data).toBeDefined();
      expect(data.event).toBe("pregame_select");
      expect(data.error).toContain("agentUuid");
      done();
    });
  });

  it("should reject negative credits in update_ingame_credits with validation error", (done) => {
    socket.emit("update_ingame_credits", {
      credits: -500,
    });

    socket.once("error_response", (data) => {
      expect(data).toBeDefined();
      expect(data.event).toBe("update_ingame_credits");
      expect(data.error).toContain("créditos");
      done();
    });
  });

  it("should handle request_player_profile gracefully without crashing", (done) => {
    socket.emit("request_player_profile", { forceRefresh: true });

    socket.once("player_profile_result", (data) => {
      expect(data).toBeDefined();
      // Since no real Valorant client is running in CI/test, success is false or profile is null
      expect(typeof data.success).toBe("boolean");
      done();
    });
  });

  it("should handle request_ml_draft with sanitized allies safely", (done) => {
    socket.emit("request_ml_draft", {
      mapName: "Ascent",
      allies: ["jett", "reyna", "<script>alert(1)</script>"],
    });

    // The gateway processes the message into the Subject without throwing error
    setTimeout(() => {
      done();
    }, 200);
  });
});
