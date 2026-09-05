import { useState, useEffect } from "react";

export interface AgentAbility {
  slot: string;
  displayName: string;
  description: string;
  displayIcon: string | null;
}

export interface Agent {
  uuid: string;
  displayName: string;
  displayIcon: string;
  bustPortrait: string;
  fullPortrait: string;
  role: {
    displayName: string;
  };
  description: string;
  abilities: AgentAbility[];
}

export interface WeaponStats {
  fireRate: number;
  magazineSize: number;
  equipTimeSeconds: number;
  reloadTimeSeconds: number;
  firstBulletAccuracy: number;
  damageRanges: {
    rangeStartMeters: number;
    rangeEndMeters: number;
    headDamage: number;
    bodyDamage: number;
    legDamage: number;
  }[];
}

export interface Weapon {
  uuid: string;
  displayName: string;
  category: string;
  displayIcon: string;
  shopData: {
    cost: number;
    category: string;
    categoryText: string;
  } | null;
  weaponStats: WeaponStats | null;
}

export interface GameModeInfo {
  uuid: string;
  displayName: string;
  displayIcon: string | null;
  duration?: string | null;
}

export interface MapInfo {
  uuid: string;
  displayName: string;
  splash: string;
  displayIcon: string | null;
  coordinates: string | null;
}

interface ValorantDataState {
  agents: Agent[];
  weapons: Weapon[];
  gameModes: GameModeInfo[];
  maps: MapInfo[];
  loading: boolean;
}

// ============================================================================
// CACHÉ EN MEMORIA (Singleton a nivel de módulo)
// ============================================================================
let globalAgents: Agent[] | null = null;
let globalWeapons: Weapon[] | null = null;
let globalGameModes: GameModeInfo[] | null = null;
let globalMaps: MapInfo[] | null = null;
let globalFetchPromise: Promise<void> | null = null;

function loadFromLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function saveToLocalStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignorar si excede cuota o storage deshabilitado
  }
}

function getInitialData(): ValorantDataState {
  const cachedAgents = globalAgents || loadFromLocalStorage<Agent[]>("vdata_agents") || [];
  const cachedWeapons = globalWeapons || loadFromLocalStorage<Weapon[]>("vdata_weapons") || [];
  const cachedModes = globalGameModes || loadFromLocalStorage<GameModeInfo[]>("vdata_gamemodes") || [];
  const cachedMaps = globalMaps || loadFromLocalStorage<MapInfo[]>("vdata_maps") || [];

  if (cachedAgents.length > 0) {
    globalAgents = cachedAgents;
    globalWeapons = cachedWeapons;
    globalGameModes = cachedModes;
    globalMaps = cachedMaps;
    return {
      agents: cachedAgents,
      weapons: cachedWeapons,
      gameModes: cachedModes,
      maps: cachedMaps,
      loading: false,
    };
  }

  return {
    agents: [],
    weapons: [],
    gameModes: [],
    maps: [],
    loading: true,
  };
}

export function useValorantData() {
  const [state, setState] = useState<ValorantDataState>(getInitialData);

  useEffect(() => {
    // Si ya tenemos los datos completos cargados en el estado inicial, no realizar peticiones
    if (!state.loading && state.agents.length > 0) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    if (!globalFetchPromise) {
      globalFetchPromise = (async () => {
        try {
          const [agentRes, weaponRes, modeRes, mapRes] = await Promise.all([
            fetch("https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=en-US", {
              signal: controller.signal,
            }),
            fetch("https://valorant-api.com/v1/weapons?language=en-US", {
              signal: controller.signal,
            }),
            fetch("https://valorant-api.com/v1/gamemodes?language=en-US", {
              signal: controller.signal,
            }),
            fetch("https://valorant-api.com/v1/maps?language=en-US", {
              signal: controller.signal,
            }),
          ]);

          if (agentRes.ok) {
            const agentJson = await agentRes.json();
            if (agentJson && Array.isArray(agentJson.data)) {
              globalAgents = agentJson.data;
              saveToLocalStorage("vdata_agents", globalAgents);
            }
          }

          if (weaponRes.ok) {
            const weaponJson = await weaponRes.json();
            if (weaponJson && Array.isArray(weaponJson.data)) {
              globalWeapons = weaponJson.data;
              saveToLocalStorage("vdata_weapons", globalWeapons);
            }
          }

          if (modeRes.ok) {
            const modeJson = await modeRes.json();
            if (modeJson && Array.isArray(modeJson.data)) {
              globalGameModes = modeJson.data;
              saveToLocalStorage("vdata_gamemodes", globalGameModes);
            }
          }

          if (mapRes.ok) {
            const mapJson = await mapRes.json();
            if (mapJson && Array.isArray(mapJson.data)) {
              const playableMaps = (mapJson.data as MapInfo[]).filter(
                (m: MapInfo) => Boolean(m.coordinates),
              );
              globalMaps = playableMaps.length > 0 ? playableMaps : mapJson.data;
              saveToLocalStorage("vdata_maps", globalMaps);
            }
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }
          console.warn("Advertencia: No se pudo actualizar datos desde valorant-api.com:", err);
        } finally {
          globalFetchPromise = null;
        }
      })();
    }

    globalFetchPromise.then(() => {
      if (!isMounted) return;
      setState({
        agents: globalAgents || [],
        weapons: globalWeapons || [],
        gameModes: globalGameModes || [],
        maps: globalMaps || [],
        loading: false,
      });
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [state.loading, state.agents.length]);

  return {
    agents: state.agents,
    weapons: state.weapons,
    gameModes: state.gameModes,
    maps: state.maps,
    loading: state.loading,
  };
}