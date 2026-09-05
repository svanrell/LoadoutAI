import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export interface PregamePlayerResponse {
  Subject: string;
  MatchID: string;
}

export interface PregameMatchPlayer {
  Subject: string;
  CharacterID: string;
  CharacterSelectionState: string;
  PregamePlayerState: string;
  CompetitiveTier: number;
  PlayerIdentity?: {
    AccountLevel: number;
    PlayerCardID: string;
    HideAccountLevel: boolean;
  };
}

export interface PregameMatchResponse {
  ID: string;
  MapID: string;
  AllyTeam: {
    Players: PregameMatchPlayer[];
  };
}

@Injectable()
export class RiotPregameService {
  private readonly logger = new Logger(RiotPregameService.name);

  constructor(private readonly httpService: HttpService) {}

  public async getPregameMatch(
    glzUrl: string,
    headers: Record<string, string>,
    puuid: string,
  ): Promise<{ matchId: string; data: PregameMatchResponse } | null> {
    try {
      const pregamePlayer = await firstValueFrom(
        this.httpService.get<PregamePlayerResponse>(
          `${glzUrl}/pregame/v1/players/${puuid}`,
          { headers },
        ),
      );
      const matchId = pregamePlayer.data.MatchID;

      const pregameMatch = await firstValueFrom(
        this.httpService.get<PregameMatchResponse>(
          `${glzUrl}/pregame/v1/matches/${matchId}`,
          { headers },
        ),
      );

      return { matchId, data: pregameMatch.data };
    } catch (error) {
      this.logger.debug(
        `No se pudo obtener datos pregame: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  public async selectAgent(
    glzUrl: string,
    headers: Record<string, string>,
    matchId: string,
    agentUuid: string,
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${glzUrl}/pregame/v1/matches/${matchId}/select/${agentUuid}`,
          {},
          { headers },
        ),
      );
      this.logger.log(
        `Agente ${agentUuid} pre-seleccionado en match ${matchId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error al pre-seleccionar agente ${agentUuid}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  public async lockAgent(
    glzUrl: string,
    headers: Record<string, string>,
    matchId: string,
    agentUuid: string,
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${glzUrl}/pregame/v1/matches/${matchId}/lock/${agentUuid}`,
          {},
          { headers },
        ),
      );
      this.logger.log(
        `Agente ${agentUuid} bloqueado (locked) en match ${matchId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error al bloquear agente ${agentUuid}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
