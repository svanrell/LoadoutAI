/**
 * ingameLogic.ts
 * ==============
 * Funciones puras y cálculos para la armería y tienda de compra In-Game.
 * Centraliza las transiciones de equipamiento, resolución de recomendaciones de IA
 * y cálculo dinámico de costes para mantener ViewIngame limpio y enfocado a la UI.
 */

import type { Weapon } from "@/hooks/useValorantData";
import type { BuyRecommendation } from "@/hooks/useGameState";
import { ARMORS_DATA } from "@/data/weaponsData";
import { getAgentAbilityCatalog } from "@/data/agentAbilitiesData";

/**
 * Equipamiento de la tienda. primaryName y armorName a null significan
 * "sin arma principal" y "sin escudo", que son elecciones válidas.
 */
export interface Loadout {
  sidearmName: string;
  primaryName: string | null;
  armorName: string | null;
}

const EMPTY_LOADOUT: Loadout = { sidearmName: "Classic", primaryName: null, armorName: null };

function isSameName(a: string | null, b: string): boolean {
  return Boolean(a) && (a as string).toUpperCase() === b.toUpperCase();
}

/**
 * Traduce las recomendaciones de IA (ej: "Vandal", "Heavy Shield") a nombres
 * de armas y escudos coincidentes con el catálogo de la tienda.
 */
export function resolveAiRecommendation(
  buyRecommendations: BuyRecommendation | null,
  allWeapons: Weapon[]
): Loadout {
  if (!buyRecommendations) {
    return EMPTY_LOADOUT;
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
    const lowerRec = recShield.toLowerCase();
    const foundArmor = ARMORS_DATA.find((a) => {
      const aLower = a.name.toLowerCase();
      if (aLower === lowerRec || aLower.includes(lowerRec) || lowerRec.includes(aLower)) return true;
      if (lowerRec.includes("heavy") || lowerRec.includes("pesad")) {
        return aLower.includes("pesad") || a.cost === 1000;
      }
      if (lowerRec.includes("light") || lowerRec.includes("liger")) {
        return aLower.includes("liger") || a.cost === 400;
      }
      if (lowerRec.includes("regen")) {
        return aLower.includes("regen") || a.cost === 650;
      }
      return false;
    });
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
 * Nuevo equipamiento al hacer clic en un arma de la tienda.
 *
 * `shown` tiene que ser el equipamiento que se ve en pantalla: el de la IA si se
 * sigue su recomendación, o el manual si no. Partir de una elección manual anterior
 * hacía que, tras volver a la IA, pulsar un arma la quitara en vez de equiparla.
 * Pulsar un arma ya equipada la quita (la pistola vuelve a la Classic).
 */
export function computeToggleWeapon(weapon: Weapon, shown: Loadout): Loadout {
  const name = weapon.displayName;
  if (weapon.category === "EEquippableCategory::Sidearm") {
    return { ...shown, sidearmName: isSameName(shown.sidearmName, name) ? "Classic" : name };
  }
  return { ...shown, primaryName: isSameName(shown.primaryName, name) ? null : name };
}

/**
 * Nuevo equipamiento al hacer clic en un escudo, partiendo de lo que se ve en pantalla.
 * Pulsar el escudo equipado lo quita.
 */
export function computeToggleArmor(shown: Loadout, targetArmorName: string): Loadout {
  return { ...shown, armorName: shown.armorName === targetArmorName ? null : targetArmorName };
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
  // Misma lista que muestra la tienda (incluidas las habilidades genéricas de un agente nuevo)
  for (const ab of getAgentAbilityCatalog(agentName)) {
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
    if (
      typeof buyRecommendations.cost === "number" &&
      Number.isFinite(buyRecommendations.cost) &&
      buyRecommendations.cost >= 0
    ) {
      return buyRecommendations.cost;
    }
    return manualTotal;
  }
  return manualTotal;
}
