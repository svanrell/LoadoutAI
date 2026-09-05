import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export interface CoreGamePlayer {
  Subject: string;
  TeamID: string;
  CharacterID: string;
  PlayerIdentity?: {
    AccountLevel: number;
    PlayerCardID: string;
  };
}

export interface CoreGameMatchResponse {
  MatchID: string;
  Players: CoreGamePlayer[];
}

export interface LocalPlayerInfo {
  puuid: string;
  agentId: string;
  state: string;
  level: number | null;
  rank: number;
  playerCardId?: string;
}

@Injectable()
export class RiotCoregameService {
  private readonly logger = new Logger(RiotCoregameService.name);

  constructor(private readonly httpService: HttpService) {}

  public async getCoreGameTeammates(
    glzUrl: string,
    headers: Record<string, string>,
    puuid: string,
    presencesData?: Array<{ puuid: string; private: string }>,
  ): Promise<{ matchId: string; players: LocalPlayerInfo[] } | null> {
    try {
      const coregamePlayer = await firstValueFrom(
        this.httpService.get<{ MatchID: string }>(
          `${glzUrl}/core-game/v1/players/${puuid}`,
          { headers },
        ),
      );
      const coregameMatchId = coregamePlayer.data.MatchID;

      const coregameMatch = await firstValueFrom(
        this.httpService.get<CoreGameMatchResponse>(
          `${glzUrl}/core-game/v1/matches/${coregameMatchId}`,
          { headers },
        ),
      );

      const myPlayer = coregameMatch.data.Players.find(
        (p) => p.Subject === puuid,
      );
      const myTeamId = myPlayer ? myPlayer.TeamID : null;

      const teammatePlayers = coregameMatch.data.Players.filter(
        (p) => p.TeamID === myTeamId,
      );

      const players: LocalPlayerInfo[] = teammatePlayers.map((p) => {
        const playerPresence = presencesData?.find(
          (presence) => presence.puuid === p.Subject,
        );
        let rank = 0;
        if (playerPresence && playerPresence.private) {
          try {
            const decoded = Buffer.from(
              playerPresence.private,
              "base64",
            ).toString("utf8");
            const parsed = JSON.parse(decoded);
            rank = parsed.competitiveTier || 0;
          } catch {
            rank = 0;
          }
        }

        return {
          puuid: p.Subject,
          agentId: p.CharacterID,
          state: "locked",
          level: p.PlayerIdentity?.AccountLevel || null,
          rank,
          playerCardId: p.PlayerIdentity?.PlayerCardID,
        };
      });

      return { matchId: coregameMatchId, players };
    } catch (error) {
      this.logger.debug(
        `No se pudo obtener información de core-game: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
