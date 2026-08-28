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
 * Normaliza y devuelve el nombre legible de cualquier modo de juego de VALORANT según el idioma.
 */
export function getGameModeName(modeIdOrName: string = "", lang: "es" | "en" = "es"): string {
  const norm = modeIdOrName.trim().toLowerCase().replace(/[\s\-_]/g, "");
  if (!norm) return lang === "es" ? "Competitivo" : "Competitive";

  if (norm === "hurm" || norm.includes("teamdeathmatch") || norm === "tdm") {
    return lang === "es" ? "Combate a Muerte por Equipos" : "Team Deathmatch";
  }
  if (norm === "spikerush" || norm.includes("spike")) {
    return lang === "es" ? "Fiebre de la Spike" : "Spike Rush";
  }
  if (norm === "swiftplay" || norm.includes("swift")) {
    return lang === "es" ? "Modo Rápido" : "Swiftplay";
  }
  if (norm === "competitive" || norm.includes("compet") || norm === "comp") {
    return lang === "es" ? "Competitivo" : "Competitive";
  }
  if (norm === "unrated" || norm === "standard") {
    return lang === "es" ? "No Clasificatoria" : "Unrated";
  }
  if (norm === "deathmatch" || norm === "dm") {
    return lang === "es" ? "Combate a Muerte" : "Deathmatch";
  }
  if (norm === "premier") {
    return "Premier";
  }
  if (norm === "escalation" || norm === "ggteam") {
    return lang === "es" ? "Carrera Armamentística" : "Escalation";
  }
  if (norm === "custom" || norm.includes("custom")) {
    return lang === "es" ? "Personalizada" : "Custom Game";
  }

  const found = VALORANT_GAME_MODES.find(
    (m) =>
      m.id.toLowerCase() === norm ||
      m.name.toLowerCase().replace(/[\s\-_]/g, "") === norm
  );

  return found ? (lang === "es" ? getGameModeName(found.id, "es") : found.name) : modeIdOrName;
}

/**
 * Indica si un modo de juego es competitivo / rankeado.
 */
export function isRankedMode(modeIdOrName: string = ""): boolean {
  const norm = modeIdOrName.trim().toLowerCase();
  return norm.includes("competitive") || norm.includes("premier");
}
