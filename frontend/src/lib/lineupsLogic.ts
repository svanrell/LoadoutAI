/**
 * lineupsLogic.ts
 * ===============
 * Filtrado de lineups y opciones de los filtros de la vista Lineups.
 */

import type { LineupItem, LineupSite, Side } from "@/data/lineupsData";

/** Valor de los filtros que no filtran nada */
export const ALL_FILTER = "all";

export interface LineupFilters {
  map: string;
  agent: string;
  side: Side | typeof ALL_FILTER;
  site: LineupSite | typeof ALL_FILTER;
  query: string;
}

export const EMPTY_LINEUP_FILTERS: LineupFilters = {
  map: ALL_FILTER,
  agent: ALL_FILTER,
  side: ALL_FILTER,
  site: ALL_FILTER,
  query: "",
};

/** Clave de comparación: sin mayúsculas, espacios ni símbolos ("KAY/O" = "kayo") */
export function lineupKey(value: string | undefined): string {
  return (value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function hasActiveLineupFilters(filters: LineupFilters): boolean {
  return (
    filters.map !== ALL_FILTER ||
    filters.agent !== ALL_FILTER ||
    filters.side !== ALL_FILTER ||
    filters.site !== ALL_FILTER ||
    filters.query.trim() !== ""
  );
}

/**
 * Filtra los lineups. Mapa, agente, bando y zona se comparan sin distinguir
 * mayúsculas ni espacios; la búsqueda se recorta (trim) y busca en título,
 * habilidad y agente.
 */
export function filterLineups(lineups: LineupItem[], filters: LineupFilters): LineupItem[] {
  const query = filters.query.trim().toLowerCase();
  return lineups.filter((item) => {
    if (filters.map !== ALL_FILTER && lineupKey(item.map) !== lineupKey(filters.map)) return false;
    if (filters.agent !== ALL_FILTER && lineupKey(item.agent) !== lineupKey(filters.agent)) return false;
    if (filters.side !== ALL_FILTER && lineupKey(item.side) !== lineupKey(filters.side)) return false;
    if (filters.site !== ALL_FILTER && lineupKey(item.site) !== lineupKey(filters.site)) return false;
    if (!query) return true;
    return [item.title, item.ability, item.agent].some((field) =>
      (field || "").toLowerCase().includes(query)
    );
  });
}

/** Opciones únicas y ordenadas alfabéticamente para un filtro (sin duplicados por mayúsculas) */
export function buildFilterOptions(names: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const name of names) {
    const key = lineupKey(name);
    if (key && !byKey.has(key)) byKey.set(key, name.trim());
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}
