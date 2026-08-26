/**
 * economyEngine.ts
 * ================
 * Motor centralizado y modular para las reglas oficiales de economía de VALORANT.
 * Gestiona el cálculo de créditos, gastos de tienda, recompensas de rondas,
 * rachas de derrotas y proyecciones para la próxima ronda.
 */

// Constantes oficiales de la economía de Valorant
export const VALORANT_ECONOMY_RULES = {
  STARTING_CREDITS: 800,           // Ronda 1 (Pistol 1ª mitad)
  HALFTIME_STARTING_CREDITS: 800,  // Ronda 13 (Cambio de bando / 2ª mitad)
  OVERTIME_STARTING_CREDITS: 5000, // Ronda 25+ (Prórroga / Overtime)
  MAX_CREDITS: 9000,               // Tope máximo acumulable en el banco
  WIN_REWARD: 3000,                // Victoria de ronda
  LOSS_REWARD_BASE: 1900,          // 1ª derrota consecutiva
  LOSS_REWARD_TIER_2: 2400,        // 2ª derrota consecutiva
  LOSS_REWARD_TIER_3: 2900,        // 3+ derrotas consecutivas
  SPIKE_PLANT_BONUS: 300,          // Bono a atacantes si la spike fue plantada
  KILL_REWARD: 200,                // Bono por cada baja (kill)
} as const;

export type RoundOutcome = "win" | "loss";

export interface EconomyProjection {
  currentBank: number;
  totalSpend: number;
  leftoverCredits: number;
  minNextRoundLoss: number;       // Créditos mínimos garantizados si pierdes
  minNextRoundWin: number;        // Créditos si ganas la ronda
  lossReward: number;             // Recompensa que correspondería por derrota (+ racha)
  lossStreak: number;             // Racha actual de derrotas
  isCapped: boolean;              // Indica si el dinero alcanza el tope de 9.000
}

export interface CustomBuySpend {
  weaponCost: number;
  armorCost: number;
  abilitiesCost: number;
  totalSpend: number;
}

/**
 * Calcula la recompensa en créditos que se otorga por perder la ronda actual según la racha de derrotas.
 * @param lossStreak Número de derrotas consecutivas previas (0, 1, 2, 3+)
 */
export function getLossReward(lossStreak: number): number {
  if (lossStreak <= 0) return VALORANT_ECONOMY_RULES.LOSS_REWARD_BASE;
  if (lossStreak === 1) return VALORANT_ECONOMY_RULES.LOSS_REWARD_TIER_2;
  return VALORANT_ECONOMY_RULES.LOSS_REWARD_TIER_3;
}

/**
 * Comprueba si la ronda es una ronda de reseteo forzoso de inventario y créditos (Ronda 1, Ronda 13, o Prórroga).
 */
export function isSpecialResetRound(round: number): boolean {
  return round === 1 || round === 13 || round >= 25;
}

/**
 * Devuelve los créditos asignados por reseteo si la ronda es especial, o null si es una ronda normal.
 */
export function getResetCreditsForRound(round: number): number | null {
  if (round === 1 || round === 13) {
    return VALORANT_ECONOMY_RULES.STARTING_CREDITS;
  }
  if (round >= 25) {
    return VALORANT_ECONOMY_RULES.OVERTIME_STARTING_CREDITS;
  }
  return null;
}

/**
 * Calcula el dinero sobrante tras realizar una compra.
 */
export function calculateLeftoverCredits(bankCredits: number, totalSpend: number): number {
  return Math.max(0, bankCredits - Math.max(0, totalSpend));
}

/**
 * Proyecta la economía para la siguiente ronda (tanto el mínimo por derrota como la ganancia por victoria).
 */
export function calculateNextRoundProjection(
  bankCredits: number,
  totalSpend: number,
  lossStreak: number = 0,
  spikePlanted: boolean = false,
): EconomyProjection {
  const leftoverCredits = calculateLeftoverCredits(bankCredits, totalSpend);
  const lossReward = getLossReward(lossStreak) + (spikePlanted ? VALORANT_ECONOMY_RULES.SPIKE_PLANT_BONUS : 0);
  const winReward = VALORANT_ECONOMY_RULES.WIN_REWARD + (spikePlanted ? VALORANT_ECONOMY_RULES.SPIKE_PLANT_BONUS : 0);

  const rawMinLoss = leftoverCredits + lossReward;
  const rawMinWin = leftoverCredits + winReward;

  const minNextRoundLoss = Math.min(VALORANT_ECONOMY_RULES.MAX_CREDITS, rawMinLoss);
  const minNextRoundWin = Math.min(VALORANT_ECONOMY_RULES.MAX_CREDITS, rawMinWin);

  return {
    currentBank: bankCredits,
    totalSpend,
    leftoverCredits,
    minNextRoundLoss,
    minNextRoundWin,
    lossReward,
    lossStreak,
    isCapped: rawMinLoss >= VALORANT_ECONOMY_RULES.MAX_CREDITS,
  };
}

/**
 * Avanza la economía a la siguiente ronda tras conocer el resultado del combate.
 */
export function advanceRoundEconomy(params: {
  previousBank: number;
  totalSpend: number;
  outcome: RoundOutcome;
  previousLossStreak: number;
  newRound: number;
  spikePlanted?: boolean;
  kills?: number;
}): {
  newCredits: number;
  newLossStreak: number;
} {
  const {
    previousBank,
    totalSpend,
    outcome,
    previousLossStreak,
    newRound,
    spikePlanted = false,
    kills = 0,
  } = params;

  // 1. Si la nueva ronda es de reseteo especial (mitad de partida o prórroga), forzar saldo oficial
  const resetCredits = getResetCreditsForRound(newRound);
  if (resetCredits !== null) {
    return {
      newCredits: resetCredits,
      newLossStreak: 0,
    };
  }

  // 2. Dinero sobrante que quedó tras las compras de la ronda anterior
  const leftover = calculateLeftoverCredits(previousBank, totalSpend);

  // 3. Recompensa por resultado de la ronda
  let reward = 0;
  let newLossStreak = 0;

  if (outcome === "win") {
    reward = VALORANT_ECONOMY_RULES.WIN_REWARD;
    newLossStreak = 0;
  } else {
    reward = getLossReward(previousLossStreak);
    newLossStreak = previousLossStreak + 1;
  }

  // 4. Bonos adicionales (Spike + Kills)
  if (spikePlanted) {
    reward += VALORANT_ECONOMY_RULES.SPIKE_PLANT_BONUS;
  }
  reward += Math.max(0, kills) * VALORANT_ECONOMY_RULES.KILL_REWARD;

  // 5. Aplicar tope máximo de 9.000 créditos
  const newCredits = Math.min(VALORANT_ECONOMY_RULES.MAX_CREDITS, leftover + reward);

  return {
    newCredits,
    newLossStreak,
  };
}
