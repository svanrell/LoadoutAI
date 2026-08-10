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

export function useValorantData() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentRes, weaponRes] = await Promise.all([
          fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=en-US'),
          fetch('https://valorant-api.com/v1/weapons?language=en-US')
        ]);
        
        const agentJson = await agentRes.json();
        const weaponJson = await weaponRes.json();

        if (agentJson.status === 200) {
          setAgents(agentJson.data);
        }
        if (weaponJson.status === 200) {
          setWeapons(weaponJson.data);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { agents, weapons, loading };
}
