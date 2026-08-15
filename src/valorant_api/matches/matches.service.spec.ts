import { Test, TestingModule } from "@nestjs/testing";
import { MatchesService, MatchDto } from "./matches.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { of } from "rxjs";
import * as fs from "fs";
import * as path from "path";

describe("MatchesService - Export Matches to CSV Tests", () => {
  let service: MatchesService;

  const mockMatch: MatchDto = {
    matchInfo: {
      matchId: "mock-match-uuid-9999",
      mapId: "/Game/Maps/Ascent/Ascent",
      gameLengthMillis: 1800000,
      gameStartMillis: 1779959066634,
      provisioningFlowId: "Matchmaking",
      isCompleted: true,
      queueId: "competitive",
      gameMode: "/Game/GameModes/Bomb/BombGameMode",
      isRanked: true,
      seasonId: "ce2783e8-44fc-dd48-3da3-33b5ba6c4a22",
    },
    players: [
      {
        subject: "player-puuid-shumi",
        gameName: "Shumi",
        tagLine: "EUW",
        teamId: "Blue",
        characterId: "add6443c-41c1-48b0-a04a-a71c8b3269a9",
        stats: {
          score: 4500,
          roundsPlayed: 20,
          kills: 22,
          deaths: 10,
          assists: 4,
        },
        competitiveTier: 24,
      },
      {
        subject: "player-puuid-rival",
        gameName: "RivalEsports",
        tagLine: "VLR",
        teamId: "Red",
        characterId: "5f8d3a7f-467b-a241-106e-1da3ad5cfde6",
        stats: {
          score: 3100,
          roundsPlayed: 20,
          kills: 11,
          deaths: 20,
          assists: 7,
        },
        competitiveTier: 23,
      },
    ],
    teams: [
      {
        teamId: "Blue",
        won: true,
        roundsPlayed: 20,
        roundsWon: 13,
      },
      {
        teamId: "Red",
        won: false,
        roundsPlayed: 20,
        roundsWon: 7,
      },
    ],
    roundResults: [
      {
        roundNum: 0,
        roundResult: "Elimination",
        winningTeam: "Blue",
        bombPlanter: "player-puuid-shumi",
        playerStats: [
          {
            subject: "player-puuid-shumi",
            score: 350,
            economy: {
              loadoutValue: 1000,
              weapon: "Classic",
              armor: "None",
              remaining: 800,
              spent: 0,
            },
            wasAfk: false,
            wasPenalized: false,
          },
          {
            subject: "player-puuid-rival",
            score: 100,
            economy: {
              loadoutValue: 1000,
              weapon: "Classic",
              armor: "None",
              remaining: 800,
              spent: 0,
            },
            wasAfk: false,
            wasPenalized: false,
          },
        ],
      },
      {
        roundNum: 1,
        roundResult: "Bomb detonated",
        winningTeam: "Red",
        bombPlanter: "player-puuid-rival",
        bombDefuser: "",
        playerStats: [
          {
            subject: "player-puuid-shumi",
            score: 150,
            economy: {
              loadoutValue: 1900,
              weapon: "Ghost",
              armor: "Light Armor",
              remaining: 100,
              spent: 900,
            },
            wasAfk: false,
            wasPenalized: false,
          },
          {
            subject: "player-puuid-rival",
            score: 400,
            economy: {
              loadoutValue: 1900,
              weapon: "Ghost",
              armor: "Light Armor",
              remaining: 200,
              spent: 900,
            },
            wasAfk: false,
            wasPenalized: false,
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn().mockReturnValue(of({ data: mockMatch })),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === "VALORANT_API_KEY") return "mock-key";
        if (key === "VALORANT_REGION") return "eu";
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  it("Should fetch match details and export them to corresponding CSV files", (done) => {
    service.loadMatch("mock-match-uuid-9999").subscribe({
      next: (match) => {
        expect(match).toBeDefined();
        expect(match.matchInfo.matchId).toBe("mock-match-uuid-9999");

        const dirPath = path.join(process.cwd(), "infoApi");
        expect(fs.existsSync(path.join(dirPath, "match_metadata.csv"))).toBe(
          true,
        );
        expect(fs.existsSync(path.join(dirPath, "match_players.csv"))).toBe(
          true,
        );
        expect(fs.existsSync(path.join(dirPath, "match_rounds.csv"))).toBe(
          true,
        );
        expect(
          fs.existsSync(path.join(dirPath, "match_round_purchases.csv")),
        ).toBe(true);

        const metadataContent = fs.readFileSync(
          path.join(dirPath, "match_metadata.csv"),
          "utf8",
        );
        expect(metadataContent).toContain("mock-match-uuid-9999");

        done();
      },
      error: (err) => {
        done(err);
      },
    });
  });
});
