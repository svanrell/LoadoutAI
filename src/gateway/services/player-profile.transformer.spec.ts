import {
  PlayerProfileTransformer,
  ProfileTransformInput,
} from "./player-profile.transformer";
import { MatchDetailsResponse } from "../valorant-history.service";

describe("PlayerProfileTransformer", () => {
  describe("formatTimeAgo", () => {
    it("should format minutes ago accurately", () => {
      const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
      expect(PlayerProfileTransformer.formatTimeAgo(fiveMinsAgo)).toBe(
        "5m ago",
      );
    });

    it("should format hours ago accurately", () => {
      const threeHoursAgo = Date.now() - 3 * 3600 * 1000;
      expect(PlayerProfileTransformer.formatTimeAgo(threeHoursAgo)).toBe(
        "3h ago",
      );
    });

    it("should format days ago accurately", () => {
      const fourDaysAgo = Date.now() - 4 * 86400 * 1000;
      expect(PlayerProfileTransformer.formatTimeAgo(fourDaysAgo)).toBe(
        "4d ago",
      );
    });
  });

  describe("transform", () => {
    const defaultInput: ProfileTransformInput = {
      puuid: "user-test-puuid",
      namesList: [
        {
          DisplayName: "Agent#123",
          GameName: "Agent",
          TagLine: "123",
          Subject: "user-test-puuid",
        },
      ],
      mmrData: {
        LatestCompetitiveUpdate: {
          TierAfterUpdate: 14,
          RankedRatingAfterUpdate: 75,
        },
      } as unknown as ProfileTransformInput["mmrData"],
      historyData: {
        Subject: "user-test-puuid",
        BeginIndex: 0,
        EndIndex: 0,
        Total: 0,
        History: [],
      },
      compUpdatesRes: null,
      loadoutData: {
        Identity: {
          PlayerCardID: "test-card-uuid",
          AccountLevel: 125,
        },
      } as unknown as ProfileTransformInput["loadoutData"],
      localPresence: null,
      detailsList: [],
      region: "eu",
    };

    it("should assemble profile with player name and competitive MMR correctly", () => {
      const profile = PlayerProfileTransformer.transform(defaultInput);
      expect(profile.puuid).toBe("user-test-puuid");
      expect(profile.gameName).toBe("Agent");
      expect(profile.tagLine).toBe("123");
      expect(profile.currentTier).toBe(14);
      expect(profile.rankName).toBe("Gold 3");
      expect(profile.rankedRating).toBe(75);
      expect(profile.playerCardId).toBe("test-card-uuid");
      expect(profile.accountLevel).toBe(125);
      expect(profile.totalMatches).toBe(0);
      expect(profile.winRate).toBe(0);
    });

    it("should calculate match stats, MVP, and win rate correctly from detailsList", () => {
      const mockMatch = {
        matchInfo: {
          matchId: "match-uuid-1",
          mapId: "/Game/Maps/Ascent/Ascent",
          gameMode: "/Game/GameModes/Bomb/BombGameMode",
          gameStartMillis: Date.now() - 30 * 60 * 1000,
          isRanked: true,
        },
        players: [
          {
            subject: "user-test-puuid",
            teamId: "Blue",
            characterId: "add6443a-41bd-e414-f6ad-e58d267f4e95", // Jett
            stats: {
              score: 5500,
              roundsPlayed: 20,
              kills: 25,
              deaths: 10,
              assists: 5,
            },
          },
          {
            subject: "enemy-puuid",
            teamId: "Red",
            characterId: "a3bfb854-43ae-cb54-ec50-d4b99dae1a32",
            stats: {
              score: 3200,
              roundsPlayed: 20,
              kills: 10,
              deaths: 20,
              assists: 2,
            },
          },
        ],
        teams: [
          { teamId: "Blue", won: true, roundsWon: 13, roundsPlayed: 20 },
          { teamId: "Red", won: false, roundsWon: 7, roundsPlayed: 20 },
        ],
        roundResults: [],
      } as unknown as MatchDetailsResponse;

      const inputWithMatches: ProfileTransformInput = {
        ...defaultInput,
        detailsList: [mockMatch],
      };

      const profile = PlayerProfileTransformer.transform(inputWithMatches);
      expect(profile.totalMatches).toBe(1);
      expect(profile.winRate).toBe(100);
      expect(profile.streak).toEqual(["W"]);
      expect(profile.matches).toHaveLength(1);

      const match = profile.matches[0];
      expect(match.isWin).toBe(true);
      expect(match.isMvp).toBe(true);
      expect(match.placement).toBe("MVP");
      expect(match.kd).toBe("2.50");
      expect(match.kda).toBe("25 / 10 / 5");
      expect(match.mapName).toBe("Ascent");
      expect(match.scoreWon).toBe(13);
      expect(match.scoreLost).toBe(7);

      expect(profile.topAgents).toHaveLength(1);
      expect(profile.topAgents[0].agentId).toBe(
        "add6443a-41bd-e414-f6ad-e58d267f4e95",
      );
      expect(profile.topAgents[0].winRate).toBe(100);
    });

    it("should handle null player presence and missing MMR gracefully", () => {
      const emptyInput: ProfileTransformInput = {
        puuid: "unknown-puuid",
        namesList: [],
        mmrData: null,
        historyData: null,
        compUpdatesRes: null,
        loadoutData: null,
        localPresence: null,
        detailsList: [],
        region: "na",
      };

      const profile = PlayerProfileTransformer.transform(emptyInput);
      expect(profile.gameName).toBe("Player");
      expect(profile.tagLine).toBe("LIVE");
      expect(profile.currentTier).toBe(0);
      expect(profile.rankName).toBe("Unranked");
      expect(profile.winRate).toBe(0);
      expect(profile.matches).toEqual([]);
    });
  });
});
