import { Weapon } from "@/hooks/useValorantData";

export interface ArmorItem {
  name: string;
  cost: number;
  icon: string;
  shieldValue: number;
}

export interface WeaponCategoryConfig {
  title: string;
  id: string;
}

// 1. Escudos / Blindajes oficiales del juego
export const ARMORS_DATA: ArmorItem[] = [
  {
    name: "ARM. LIGERA",
    cost: 400,
    icon: "https://media.valorant-api.com/gear/4dec83d5-4902-9ab3-bed6-a7a390761157/displayicon.png",
    shieldValue: 25,
  },
  {
    name: "ESCUDO REGEN.",
    cost: 650,
    icon: "https://media.valorant-api.com/gear/b1b9086d-41bd-a516-5d29-e3b34a6f1644/displayicon.png",
    shieldValue: 50,
  },
  {
    name: "ARM. PESADA",
    cost: 1000,
    icon: "https://media.valorant-api.com/gear/822bcab2-40a2-324e-c137-e09195ad7692/displayicon.png",
    shieldValue: 50,
  },
];

// 2. Orden canónico de compra en la armería de VALORANT
export const WEAPON_SORT_ORDER: string[] = [
  // Armas de Mano (Sidearms)
  "CLASSIC",
  "SHORTY",
  "FRENZY",
  "GHOST",
  "BANDIT",
  "SHERIFF",

  // Subfusiles (SMGs)
  "STINGER",
  "SPECTRE",

  // Escopetas (Shotguns)
  "BUCKY",
  "JUDGE",

  // Rifles
  "BULLDOG",
  "GUARDIAN",
  "PHANTOM",
  "VANDAL",

  // Francotiradores (Snipers)
  "MARSHAL",
  "OUTLAW",
  "OPERATOR",

  // Ametralladoras / Pesadas (Heavy)
  "ARES",
  "ODIN",
];

// 3. Definición de armas mock / complementarias
export const BANDIT_WEAPON: Weapon = {
  uuid: "bandit-mock",
  displayName: "BANDIT",
  category: "EEquippableCategory::Sidearm",
  displayIcon:
    "https://media.valorant-api.com/weapons/44d4e95c-4157-0037-81b2-17841bf2e8e3/displayicon.png",
  shopData: {
    cost: 600,
    category: "Sidearms",
    categoryText: "Arma de Mano",
  },
  weaponStats: {
    fireRate: 8.5,
    magazineSize: 12,
    equipTimeSeconds: 0.75,
    reloadTimeSeconds: 1.8,
    firstBulletAccuracy: 0.8,
    damageRanges: [
      { rangeStartMeters: 0, rangeEndMeters: 30, headDamage: 110, bodyDamage: 35, legDamage: 29 },
      { rangeStartMeters: 30, rangeEndMeters: 50, headDamage: 90, bodyDamage: 30, legDamage: 25 },
    ],
  },
};

// 4. Configuración de columnas del menú de compra
export const BUY_MENU_COLUMNS: { categories?: WeaponCategoryConfig[]; isArmor?: boolean }[] = [
  {
    categories: [{ title: "ARMAS DE MANO", id: "EEquippableCategory::Sidearm" }],
  },
  {
    categories: [
      { title: "SUBFUSILES", id: "EEquippableCategory::SMG" },
      { title: "ESCOPETAS", id: "EEquippableCategory::Shotgun" },
    ],
  },
  {
    categories: [{ title: "RIFLES", id: "EEquippableCategory::Rifle" }],
  },
  {
    categories: [
      { title: "FUSILES DE FRANCOTIRADOR", id: "EEquippableCategory::Sniper" },
      { title: "AMETRALLADORAS", id: "EEquippableCategory::Heavy" },
    ],
  },
  {
    isArmor: true,
  },
];

/**
 * Procesa, deduplica y ordena la lista de armas recibidas de la API de Riot.
 */
export function getProcessedWeapons(apiWeapons: Weapon[]): Weapon[] {
  const weaponMap = new Map<string, Weapon>();

  // 1. Registrar armas recibidas de la API
  apiWeapons.forEach((w) => {
    if (w.displayName) {
      weaponMap.set(w.displayName.toUpperCase(), w);
    }
  });

  // 2. Añadir armas complementarias si no están en la respuesta
  if (!weaponMap.has("BANDIT")) {
    weaponMap.set("BANDIT", BANDIT_WEAPON);
  }

  return Array.from(weaponMap.values());
}

/**
 * Filtra y ordena las armas de una categoría específica en base al orden de tienda.
 */
export function getCategoryWeapons(
  allWeapons: Weapon[],
  categoryId: string
): Weapon[] {
  const filtered = allWeapons.filter(
    (w) => w.category === categoryId && w.shopData
  );

  return filtered.sort((a, b) => {
    const indexA = WEAPON_SORT_ORDER.indexOf(a.displayName.toUpperCase());
    const indexB = WEAPON_SORT_ORDER.indexOf(b.displayName.toUpperCase());

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return (a.shopData?.cost || 0) - (b.shopData?.cost || 0);
  });
}

/**
 * Comprueba si el jugador puede permitirse el arma con sus créditos actuales.
 */
export function getWeaponAffordability(
  cost: number,
  playerCredits: number
): "affordable" | "unaffordable" {
  return playerCredits >= cost ? "affordable" : "unaffordable";
}
