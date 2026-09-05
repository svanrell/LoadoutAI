import { SocketEventValidator } from "./socket-events.dto";

describe("SocketEventValidator", () => {
  describe("isUuid", () => {
    it("should return true for valid UUIDs", () => {
      expect(
        SocketEventValidator.isUuid("123e4567-e89b-12d3-a456-426614174000"),
      ).toBe(true);
      expect(
        SocketEventValidator.isUuid("add6443a-41bd-e414-f6ad-e58d267f4e95"),
      ).toBe(true);
    });

    it("should return false for invalid strings and non-strings", () => {
      expect(SocketEventValidator.isUuid("not-a-uuid")).toBe(false);
      expect(SocketEventValidator.isUuid("")).toBe(false);
      expect(SocketEventValidator.isUuid(null)).toBe(false);
      expect(SocketEventValidator.isUuid(12345)).toBe(false);
      expect(
        SocketEventValidator.isUuid(
          "123e4567-e89b-12d3-a456-426614174000; DROP TABLE",
        ),
      ).toBe(false);
    });
  });

  describe("validatePregameAction", () => {
    it("should accept valid agent UUID and matchId", () => {
      const validPayload = {
        agentUuid: "ADD6443A-41BD-E414-F6AD-E58D267F4E95",
        pregameMatchId: "123e4567-e89b-12d3-a456-426614174000",
      };
      const result = SocketEventValidator.validatePregameAction(validPayload);
      expect(result.agentUuid).toBe("add6443a-41bd-e414-f6ad-e58d267f4e95");
      expect(result.pregameMatchId).toBe(
        "123e4567-e89b-12d3-a456-426614174000",
      );
    });

    it("should use fallbackMatchId when pregameMatchId is omitted in payload", () => {
      const validPayload = {
        agentUuid: "add6443a-41bd-e414-f6ad-e58d267f4e95",
      };
      const result = SocketEventValidator.validatePregameAction(
        validPayload,
        "123e4567-e89b-12d3-a456-426614174000",
      );
      expect(result.pregameMatchId).toBe(
        "123e4567-e89b-12d3-a456-426614174000",
      );
    });

    it("should throw an error for non-object payloads", () => {
      expect(() => SocketEventValidator.validatePregameAction(null)).toThrow(
        "Payload inválido para pregame action: debe ser un objeto",
      );
      expect(() =>
        SocketEventValidator.validatePregameAction("invalid"),
      ).toThrow();
    });

    it("should throw an error for invalid agent UUID", () => {
      expect(() =>
        SocketEventValidator.validatePregameAction({
          agentUuid: "not-a-valid-uuid",
        }),
      ).toThrow("agentUuid inválido");
    });

    it("should throw an error for SQL injection or script attempts", () => {
      expect(() =>
        SocketEventValidator.validatePregameAction({
          agentUuid: "add6443a'; DROP TABLE users; --",
        }),
      ).toThrow();
    });
  });

  describe("validateCredits", () => {
    it("should accept valid integer credits", () => {
      const result = SocketEventValidator.validateCredits({ credits: 3900 });
      expect(result.credits).toBe(3900);
    });

    it("should truncate fractional credits to integer", () => {
      const result = SocketEventValidator.validateCredits({ credits: 2450.75 });
      expect(result.credits).toBe(2450);
    });

    it("should throw error for negative credits", () => {
      expect(() =>
        SocketEventValidator.validateCredits({ credits: -100 }),
      ).toThrow("Cantidad de créditos inválida");
    });

    it("should throw error for excessively high credits", () => {
      expect(() =>
        SocketEventValidator.validateCredits({ credits: 100000 }),
      ).toThrow("Cantidad de créditos inválida");
    });

    it("should throw error for non-numeric credits or null payload", () => {
      expect(() => SocketEventValidator.validateCredits(null)).toThrow();
      expect(() =>
        SocketEventValidator.validateCredits({ credits: "NaN" }),
      ).toThrow();
    });
  });

  describe("validateMlDraft", () => {
    it("should accept valid map name and allies", () => {
      const result = SocketEventValidator.validateMlDraft({
        mapName: "Ascent",
        modeName: "Bomb",
        allies: ["jett", "reyna"],
      });
      expect(result.mapName).toBe("Ascent");
      expect(result.modeName).toBe("Bomb");
      expect(result.allies).toEqual(["jett", "reyna"]);
    });

    it("should truncate allies to at most 5 elements", () => {
      const result = SocketEventValidator.validateMlDraft({
        allies: ["a1", "a2", "a3", "a4", "a5", "a6", "a7"],
      });
      expect(result.allies).toHaveLength(5);
    });

    it("should return empty object on non-object input", () => {
      expect(SocketEventValidator.validateMlDraft(null)).toEqual({});
      expect(SocketEventValidator.validateMlDraft(123)).toEqual({});
    });
  });

  describe("validatePlayerProfile", () => {
    it("should accept valid UUID puuid and forceRefresh flag", () => {
      const result = SocketEventValidator.validatePlayerProfile({
        puuid: "123e4567-e89b-12d3-a456-426614174000",
        forceRefresh: true,
      });
      expect(result.puuid).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(result.forceRefresh).toBe(true);
    });

    it("should throw an error if puuid is provided but invalid", () => {
      expect(() =>
        SocketEventValidator.validatePlayerProfile({
          puuid: "invalid-puuid-format",
        }),
      ).toThrow("PUUID inválido");
    });

    it("should default forceRefresh to false when omitted", () => {
      const result = SocketEventValidator.validatePlayerProfile({});
      expect(result.forceRefresh).toBe(false);
      expect(result.puuid).toBeUndefined();
    });
  });
});
