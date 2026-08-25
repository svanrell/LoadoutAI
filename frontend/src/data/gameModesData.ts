export interface GameModeData {
  id: string;
  name: string;
  description?: string;
  isRanked?: boolean;
}

export const VALORANT_GAME_MODES: GameModeData[] = [
  {
    id: "competitive",
    name: "Competitive",
    description: "5v5 Ranked Tactical Defusal",
    isRanked: true,
  },
  {
    id: "unrated",
    name: "Unrated",
    description: "Standard 5v5 Tactical Defusal",
    isRanked: false,
  },
  {
    id: "swiftplay",
    name: "Swiftplay",
    description: "Fast-paced 5v5 First to 5 Rounds",
    isRanked: false,
  },
  {
    id: "spikerush",
    name: "Spike Rush",
    description: "Quick 5v5 with Random Weapons & Powerups",
    isRanked: false,
  },
  {
    id: "deathmatch",
    name: "Deathmatch",
    description: "Free-for-all Gunplay Practice",
    isRanked: false,
  },
  {
    id: "hurm",
    name: "Team Deathmatch",
    description: "5v5 Respawns in Custom Arenas",
    isRanked: false,
  },
  {
    id: "premier",
    name: "Premier",
    description: "Tournament Team Competitive System",
    isRanked: true,
  },
  {
    id: "escalation",
    name: "Escalation",
    description: "Team Gun Game Cycling Through Weapons",
    isRanked: false,
  },
  {
    id: "custom",
    name: "Custom Game",
    description: "Private Lobby Match",
    isRanked: false,
  },
];

export const DEFAULT_GAME_MODES = VALORANT_GAME_MODES.map((m) => ({
  id: m.id,
  name: m.name,
}));

/**
 * Normaliza y devuelve el nombre legible de cualquier modo de juego de VALORANT.
 */
export function getGameModeName(modeIdOrName: string = ""): string {
  const norm = modeIdOrName.trim().toLowerCase().replace(/[\s\-_]/g, "");
  if (!norm) return "Competitive";

  if (norm === "hurm" || norm.includes("teamdeathmatch")) return "Team Deathmatch";
  if (norm === "spikerush") return "Spike Rush";
  if (norm === "swiftplay") return "Swiftplay";
  if (norm === "competitive" || norm === "comp") return "Competitive";
  if (norm === "unrated") return "Unrated";
  if (norm === "deathmatch" || norm === "dm") return "Deathmatch";
  if (norm === "premier") return "Premier";
  if (norm === "escalation") return "Escalation";
  if (norm === "custom" || norm === "customgame") return "Custom Game";

  const found = VALORANT_GAME_MODES.find(
    (m) =>
      m.id.toLowerCase() === norm ||
      m.name.toLowerCase().replace(/[\s\-_]/g, "") === norm
  );

  return found ? found.name : modeIdOrName;
}

/**
 * Indica si un modo de juego es competitivo / rankeado.
 */
export function isRankedMode(modeIdOrName: string = ""): boolean {
  const norm = modeIdOrName.trim().toLowerCase();
  return norm.includes("competitive") || norm.includes("premier");
}
