import { useState, useEffect } from 'react';

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
  category: string; // EEquippableCategory::Sidearm, EEquippableCategory::SMG, etc.
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
    return raw ? JSON.parse(raw) : null;
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

export function useValorantData() {
  const [agents, setAgents] = useState<Agent[]>(() => globalAgents || loadFromLocalStorage<Agent[]>("vdata_agents") || []);
  const [weapons, setWeapons] = useState<Weapon[]>(() => globalWeapons || loadFromLocalStorage<Weapon[]>("vdata_weapons") || []);
  const [gameModes, setGameModes] = useState<GameModeInfo[]>(() => globalGameModes || loadFromLocalStorage<GameModeInfo[]>("vdata_gamemodes") || []);
  const [maps, setMaps] = useState<MapInfo[]>(() => globalMaps || loadFromLocalStorage<MapInfo[]>("vdata_maps") || []);
  const [loading, setLoading] = useState<boolean>(() => !globalAgents || globalAgents.length === 0);

  useEffect(() => {
    // Si ya tenemos los datos en memoria global, no hacemos peticiones de red
    if (globalAgents && globalWeapons && globalGameModes && globalMaps) {
      setAgents(globalAgents);
      setWeapons(globalWeapons);
      setGameModes(globalGameModes);
      setMaps(globalMaps);
      setLoading(false);
      return;
    }

    if (!globalFetchPromise) {
      globalFetchPromise = (async () => {
        try {
          const [agentRes, weaponRes, modeRes, mapRes] = await Promise.all([
            fetch("https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=en-US"),
            fetch("https://valorant-api.com/v1/weapons?language=en-US"),
            fetch("https://valorant-api.com/v1/gamemodes?language=en-US"),
            fetch("https://valorant-api.com/v1/maps?language=en-US"),
          ]);

          const agentJson = await agentRes.json();
          const weaponJson = await weaponRes.json();
          const modeJson = await modeRes.json();
          const mapJson = await mapRes.json();

          if (agentJson.status === 200) {
            globalAgents = agentJson.data;
            saveToLocalStorage("vdata_agents", globalAgents);
          }
          if (weaponJson.status === 200) {
            globalWeapons = weaponJson.data;
            saveToLocalStorage("vdata_weapons", globalWeapons);
          }
          if (modeJson.status === 200) {
            globalGameModes = modeJson.data;
            saveToLocalStorage("vdata_gamemodes", globalGameModes);
          }
          if (mapJson.status === 200) {
            const playableMaps = (mapJson.data as MapInfo[]).filter(
              (m: MapInfo) => Boolean(m.coordinates)
            );
            globalMaps = playableMaps.length > 0 ? playableMaps : mapJson.data;
            saveToLocalStorage("vdata_maps", globalMaps);
          }
        } catch (err) {
          console.error("Error fetching Valorant API static data:", err);
        } finally {
          globalFetchPromise = null;
        }
      })();
    }

    globalFetchPromise.then(() => {
      if (globalAgents) setAgents(globalAgents);
      if (globalWeapons) setWeapons(globalWeapons);
      if (globalGameModes) setGameModes(globalGameModes);
      if (globalMaps) setMaps(globalMaps);
      setLoading(false);
    });
  }, []);

  return { agents, weapons, gameModes, maps, loading };
}

