/**
 * ingameLogic.ts
 * ==============
 * Funciones puras y cálculos para la armería y tienda de compra In-Game.
 * Centraliza las transiciones de equipamiento, resolución de recomendaciones de IA
 * y cálculo dinámico de costes para mantener ViewIngame limpio y enfocado a la UI.
 */

import { Weapon } from "@/hooks/useValorantData";
import { BuyRecommendation } from "@/hooks/useGameState";
import { ARMORS_DATA } from "@/data/weaponsData";
import { AGENT_ABILITIES_DATABASE } from "@/components/shop/AbilitiesShop";

export interface AiEquipmentResolution {
  sidearmName: string;
  primaryName: string | null;
  armorName: string | null;
}

/**
 * Traduce las recomendaciones de IA (ej: "Vandal", "Heavy Shield") a nombres
 * de armas y escudos coincidentes con el catálogo de la tienda.
 */
export function resolveAiRecommendation(
  buyRecommendations: BuyRecommendation | null,
  allWeapons: Weapon[]
): AiEquipmentResolution {
  if (!buyRecommendations) {
    return {
      sidearmName: "Classic",
      primaryName: null,
      armorName: null,
    };
  }

  let sidearmName = "Classic";
  let primaryName: string | null = null;

  const recWeapon = (buyRecommendations.weapon || "").trim();
  if (!recWeapon || recWeapon.toLowerCase() === "save" || recWeapon.toLowerCase() === "eco") {
    sidearmName = "Classic";
    primaryName = null;
  } else {
    const found = allWeapons.find((w) => w.displayName.toUpperCase() === recWeapon.toUpperCase());
    if (found) {
      if (found.category === "EEquippableCategory::Sidearm") {
        sidearmName = found.displayName;
        primaryName = null;
      } else {
        sidearmName = "Classic";
        primaryName = found.displayName;
      }
    }
  }

  let armorName: string | null = null;
  const recShield = (buyRecommendations.shield || "").trim();
  if (!recShield || recShield.toLowerCase().includes("sin") || recShield.toLowerCase().includes("none")) {
    armorName = null;
  } else {
    const foundArmor = ARMORS_DATA.find(
      (a) =>
        a.name.toLowerCase() === recShield.toLowerCase() ||
        a.name.toLowerCase().includes(recShield.toLowerCase())
    );
    if (foundArmor) {
      armorName = foundArmor.name;
    }
  }

  return {
    sidearmName,
    primaryName,
    armorName,
  };
}

/**
 * Calcula el nuevo estado de equipamiento al hacer clic en un arma de la tienda.
 */
export function computeToggleWeapon(
  weapon: Weapon,
  currentSidearmName: string,
  currentPrimaryName: string | null
): { newSidearmName: string; newPrimaryName: string | null } {
  const isSidearm = weapon.category === "EEquippableCategory::Sidearm";
  const name = weapon.displayName;

  if (isSidearm) {
    const newSidearmName = currentSidearmName.toUpperCase() === name.toUpperCase() ? "Classic" : name;
    return {
      newSidearmName,
      newPrimaryName: currentPrimaryName,
    };
  } else {
    const newPrimaryName = currentPrimaryName && currentPrimaryName.toUpperCase() === name.toUpperCase() ? null : name;
    return {
      newSidearmName: currentSidearmName,
      newPrimaryName,
    };
  }
}

/**
 * Calcula el nuevo estado de armadura al hacer clic en un escudo.
 */
export function computeToggleArmor(
  currentArmorName: string | null,
  targetArmorName: string
): string | null {
  return currentArmorName === targetArmorName ? null : targetArmorName;
}

/**
 * Calcula la siguiente cantidad de cargas al ciclar una habilidad en la tienda.
 */
export function computeNextAbilityCharge(
  currentCharge: number | undefined,
  maxCharges: number,
  defaultCharges: number
): number {
  const current = currentCharge !== undefined ? currentCharge : defaultCharges;
  return current + 1 > maxCharges ? defaultCharges : current + 1;
}

/**
 * Calcula el gasto en arma secundaria (pistola). La Classic siempre es gratis (0¤).
 */
export function calculateManualSidearmSpend(
  equippedSidearmName: string,
  allWeapons: Weapon[]
): number {
  if (!equippedSidearmName || equippedSidearmName.toUpperCase() === "CLASSIC") return 0;
  const found = allWeapons.find(
    (w) => w.displayName.toUpperCase() === equippedSidearmName.toUpperCase()
  );
  return found?.shopData?.cost || 0;
}

/**
 * Calcula el gasto en arma principal (arma larga).
 */
export function calculateManualPrimarySpend(
  equippedPrimaryName: string | null,
  allWeapons: Weapon[]
): number {
  if (!equippedPrimaryName) return 0;
  const found = allWeapons.find(
    (w) => w.displayName.toUpperCase() === equippedPrimaryName.toUpperCase()
  );
  return found?.shopData?.cost || 0;
}

/**
 * Calcula el gasto en blindaje/escudo.
 */
export function calculateManualArmorSpend(
  equippedArmorName: string | null
): number {
  if (!equippedArmorName) return 0;
  const found = ARMORS_DATA.find((a) => a.name === equippedArmorName);
  return found?.cost || 0;
}

/**
 * Calcula el coste total de las cargas de habilidades compradas para un agente.
 */
export function calculateManualAbilitiesSpend(
  agentName: string,
  abilityChargesState: Record<string, number>
): number {
  let sum = 0;
  const normKey = (agentName || "jett").toLowerCase().trim();
  const list = AGENT_ABILITIES_DATABASE[normKey] || [];
  for (const ab of list) {
    const current =
      abilityChargesState[ab.id] !== undefined
        ? abilityChargesState[ab.id]
        : ab.defaultCharges;
    const boughtCharges = Math.max(0, current - ab.defaultCharges);
    sum += boughtCharges * ab.cost;
  }
  return sum;
}

/**
 * Calcula el gasto total planeado considerando si se sigue el plan de IA o la compra manual.
 */
export function calculateTotalSpend(params: {
  isFollowingAiRecommendation: boolean;
  buyRecommendations: BuyRecommendation | null;
  manualWeaponSpend: number;
  manualArmorSpend: number;
  manualAbilitiesSpend: number;
}): number {
  const {
    isFollowingAiRecommendation,
    buyRecommendations,
    manualWeaponSpend,
    manualArmorSpend,
    manualAbilitiesSpend,
  } = params;

  const manualTotal = manualWeaponSpend + manualArmorSpend + manualAbilitiesSpend;
  if (isFollowingAiRecommendation && buyRecommendations) {
    return buyRecommendations.cost || manualTotal;
  }
  return manualTotal;
}
