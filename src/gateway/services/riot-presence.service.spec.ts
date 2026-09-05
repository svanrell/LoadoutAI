import { HttpService } from "@nestjs/axios";
import { Test, TestingModule } from "@nestjs/testing";
import { RiotPresenceService } from "./riot-presence.service";
import { RiotClientService } from "./riot-client.service";

describe("RiotPresenceService", () => {
  let service: RiotPresenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiotPresenceService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: RiotClientService,
          useValue: {
            getCredentials: jest.fn(),
            getLocalHttpsAgent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RiotPresenceService>(RiotPresenceService);
  });

  describe("decodePrivateField", () => {
    it("should decode valid base64 JSON", () => {
      const payload = { sessionLoopState: "INGAME", matchMap: "Ascent" };
      const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
      const decoded = service.decodePrivateField(base64);
      expect(decoded).toEqual(payload);
    });

    it("should return null for invalid base64", () => {
      expect(service.decodePrivateField("not-valid-base64!@#")).toBeNull();
    });

    it("should return null for base64 that does not contain JSON object", () => {
      const base64 = Buffer.from("plain string not json").toString("base64");
      expect(service.decodePrivateField(base64)).toBeNull();
    });

    it("should return null for empty or whitespace string", () => {
      expect(service.decodePrivateField("")).toBeNull();
      expect(service.decodePrivateField("   ")).toBeNull();
    });
  });

  describe("parsePresenceData", () => {
    const testPuuid = "puuid-1234-abcd";

    it("should parse official nested Riot presence format correctly", () => {
      const nestedPayload = {
        sessionLoopState: "PREGAME",
        partyId: "party-uuid-999",
        partyOwnerMatchScoreAllyTeam: 5,
        partyOwnerMatchScoreEnemyTeam: 3,
        matchPresenceData: {
          sessionLoopState: "PREGAME",
          matchMap: "/Game/Maps/Ascent/Ascent",
          queueId: "competitive",
        },
        playerCardId: "card-id-1",
        accountLevel: 145,
        competitiveTier: 21,
        leaderboardPosition: 12,
      };

      const result = service.parsePresenceData(testPuuid, nestedPayload);
      expect(result).not.toBeNull();
      expect(result?.puuid).toBe(testPuuid);
      expect(result?.sessionLoopState).toBe("PREGAME");
      expect(result?.matchMap).toBe("/Game/Maps/Ascent/Ascent");
      expect(result?.queueId).toBe("competitive");
      expect(result?.partyId).toBe("party-uuid-999");
      expect(result?.allyScore).toBe(5);
      expect(result?.enemyScore).toBe(3);
      expect(result?.accountLevel).toBe(145);
      expect(result?.competitiveTier).toBe(21);
      expect(result?.leaderboardPosition).toBe(12);
    });

    it("should support fallback to root-level fields when nested data is absent", () => {
      const rootPayload = {
        sessionLoopState: "INGAME",
        matchMap: "Bind",
        queueId: "unrated",
        partyId: "party-root-111",
        partyOwnerMatchScoreAllyTeam: 11,
        partyOwnerMatchScoreEnemyTeam: 9,
      };

      const result = service.parsePresenceData(testPuuid, rootPayload);
      expect(result).not.toBeNull();
      expect(result?.matchMap).toBe("Bind");
      expect(result?.queueId).toBe("unrated");
      expect(result?.partyId).toBe("party-root-111");
      expect(result?.allyScore).toBe(11);
      expect(result?.enemyScore).toBe(9);
    });

    it("should handle incomplete payloads gracefully without throwing", () => {
      const incompletePayload = {
        sessionLoopState: "MENUS",
      };

      const result = service.parsePresenceData(testPuuid, incompletePayload);
      expect(result).not.toBeNull();
      expect(result?.sessionLoopState).toBe("MENUS");
      expect(result?.matchMap).toBeUndefined();
      expect(result?.queueId).toBeUndefined();
      expect(result?.allyScore).toBeUndefined();
      expect(result?.accountLevel).toBeUndefined();
    });

    it("should reject and ignore corrupt types (e.g. numbers in map name, string in score)", () => {
      const corruptPayload = {
        sessionLoopState: 12345, // invalid type
        matchMap: 9999, // invalid type (number instead of string)
        queueId: true, // invalid type
        partyOwnerMatchScoreAllyTeam: "not-a-number", // invalid type
        accountLevel: "level 100", // invalid type
      };

      const result = service.parsePresenceData(testPuuid, corruptPayload);
      expect(result).not.toBeNull();
      expect(result?.sessionLoopState).toBe("");
      expect(result?.matchMap).toBeUndefined();
      expect(result?.queueId).toBeUndefined();
      expect(result?.allyScore).toBeUndefined();
      expect(result?.accountLevel).toBeUndefined();
    });

    it("should return null if puuid is invalid or data is not an object", () => {
      expect(
        service.parsePresenceData("", { sessionLoopState: "MENUS" }),
      ).toBeNull();
      expect(
        service.parsePresenceData("   ", { sessionLoopState: "MENUS" }),
      ).toBeNull();
      expect(service.parsePresenceData(testPuuid, null)).toBeNull();
      expect(service.parsePresenceData(testPuuid, "string data")).toBeNull();
      expect(service.parsePresenceData(testPuuid, 123)).toBeNull();
    });
  });
});
