/**
 * lineupsData.ts
 * ==============
 * Tipos y datos de los lineups tácticos que muestra la vista Lineups.
 * page.tsx pasa LINEUPS a ViewLineups.
 */

export type Side = "attack" | "defense";
export type LineupSite = "A" | "B" | "C" | "Mid";
/** Clave de dificultad; el texto visible se traduce en la vista */
export type LineupDifficulty = "easy" | "medium" | "advanced";

export const LINEUP_SITES: LineupSite[] = ["A", "B", "C", "Mid"];

export interface LineupItem {
  id: string;
  title: string;
  /** Nombre del agente, ej. "Sova" (se compara sin distinguir mayúsculas) */
  agent: string;
  agentIcon?: string;
  /** Nombre del mapa, ej. "Ascent" (se compara sin distinguir mayúsculas) */
  map: string;
  side: Side;
  site: LineupSite;
  ability: string;
  abilityIcon?: string;
  difficulty: LineupDifficulty;
  throwType: string;
  standPosition: string;
  aimCue: string;
  landingEffect: string;
  /** Si no se indica, se usa el splash del mapa de mapsData */
  mapSplash?: string;
  videoUrl?: string;
  description?: string;
}

/**
 * Lineups disponibles. Todavía no hay ninguno: la vista muestra su estado vacío
 * hasta que se añadan aquí.
 */
export const LINEUPS: LineupItem[] = [];
