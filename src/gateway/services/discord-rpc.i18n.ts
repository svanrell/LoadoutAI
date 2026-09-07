export type RpcLanguage = "es" | "en";

export interface RpcTranslations {
  idleDetails: string;
  idleState: string;
  menuDetails: string;
  menuState: string;
  pregameDetails: (mode: string) => string;
  pregameState: (map: string) => string;
  ingameDetails: (mode: string, map: string) => string;
  ingameState: (round: number, scoreText: string) => string;
  largeImageMap: (map: string) => string;
  buttonLabel: string;
  unknownMap: string;
  unknownMode: string;
}

export const RPC_I18N: Record<RpcLanguage, RpcTranslations> = {
  es: {
    idleDetails: "Loadout AI Assistant",
    idleState: "Esperando inicio de Valorant",
    menuDetails: "Esperando a entrar en partida...",
    menuState: "Menú Principal",
    pregameDetails: (mode: string) => `Selección de agente (${mode})`,
    pregameState: (map: string) => `Mapa: ${map}`,
    ingameDetails: (mode: string, map: string) => `${mode} - ${map}`,
    ingameState: (round: number, scoreText: string) =>
      `Ronda ${round} ${scoreText}`.trim(),
    largeImageMap: (map: string) => `Mapa: ${map}`,
    buttonLabel: "Ver Loadout AI",
    unknownMap: "Desconocido",
    unknownMode: "Partida",
  },
  en: {
    idleDetails: "Loadout AI Assistant",
    idleState: "Waiting for Valorant",
    menuDetails: "Waiting to find a match...",
    menuState: "Main Menu",
    pregameDetails: (mode: string) => `Agent Selection (${mode})`,
    pregameState: (map: string) => `Map: ${map}`,
    ingameDetails: (mode: string, map: string) => `${mode} - ${map}`,
    ingameState: (round: number, scoreText: string) =>
      `Round ${round} ${scoreText}`.trim(),
    largeImageMap: (map: string) => `Map: ${map}`,
    buttonLabel: "View Loadout AI",
    unknownMap: "Unknown",
    unknownMode: "Match",
  },
};

export type LastRpcActivity =
  | { type: "idle" }
  | { type: "menu" }
  | { type: "pregame"; mapName: string; mode: string }
  | {
      type: "ingame";
      mapName: string;
      mode: string;
      allyScore: number;
      enemyScore: number;
    };
