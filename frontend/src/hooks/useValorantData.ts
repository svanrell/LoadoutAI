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

export function useValorantData() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [gameModes, setGameModes] = useState<GameModeInfo[]>([]);
  const [maps, setMaps] = useState<MapInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentRes, weaponRes, modeRes, mapRes] = await Promise.all([
          fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=en-US'),
          fetch('https://valorant-api.com/v1/weapons?language=en-US'),
          fetch('https://valorant-api.com/v1/gamemodes?language=en-US'),
          fetch('https://valorant-api.com/v1/maps?language=en-US')
        ]);
        
        const agentJson = await agentRes.json();
        const weaponJson = await weaponRes.json();
        const modeJson = await modeRes.json();
        const mapJson = await mapRes.json();

        if (agentJson.status === 200) {
          setAgents(agentJson.data);
        }
        if (weaponJson.status === 200) {
          setWeapons(weaponJson.data);
        }
        if (modeJson.status === 200) {
          setGameModes(modeJson.data);
        }
        if (mapJson.status === 200) {
          // Filter out standard non-playable maps like Range if needed or keep standard
          const playableMaps = (mapJson.data as MapInfo[]).filter(
            (m: MapInfo) => Boolean(m.coordinates)
          );
          setMaps(playableMaps.length > 0 ? playableMaps : mapJson.data);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { agents, weapons, gameModes, maps, loading };
}
