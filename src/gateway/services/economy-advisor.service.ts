import { Injectable, Logger } from "@nestjs/common";

export interface EconomyBuyRecommendation {
  weapon: string;
  shield: string;
  abilities: boolean;
  cost: number;
  tactic: string;
  site: string;
  defensor: string;
}

export interface EnemyEconomyEstimate {
  avg_credits: number;
  weapon: string;
  shield: string;
  type: string;
}

export interface MlBuyRecommendationsPayload {
  buy_recommendations: EconomyBuyRecommendation[];
  enemy_economy: EnemyEconomyEstimate;
}

@Injectable()
export class EconomyAdvisorService {
  private readonly logger = new Logger(EconomyAdvisorService.name);

  /**
   * Genera recomendaciones de compra tácticas basadas en el estado económico de la ronda.
   * Maneja explícitamente el caso de rondas eco/ahorro con coste cero (Classic + Sin escudo).
   */
  public computeRecommendations(
    currentCredits: number,
    roundNumber: number = 1,
    lossStreak: number = 0,
    enemyScore: number = 0,
  ): MlBuyRecommendationsPayload {
    const credits = Math.max(0, Math.floor(currentCredits));
    const round = Math.max(1, Math.floor(roundNumber));
    const streak = Math.max(0, Math.floor(lossStreak));

    let rec: EconomyBuyRecommendation;

    // 1. Ronda de pistolas (Ronda 1 y Ronda 13 en tiempo reglamentario)
    if (round === 1 || round === 13) {
      rec = {
        weapon: "Ghost",
        shield: "Sin escudo",
        abilities: true,
        cost: 500,
        tactic: "Pistol Round",
        site: "Default",
        defensor: "Retake",
      };
    } else if (credits >= 3900) {
      // 2. Full Buy: Vandal/Phantom (2900) + Heavy Shields (1000)
      rec = {
        weapon: "Vandal",
        shield: "Heavy Shields",
        abilities: true,
        cost: 3900,
        tactic: "Full Buy",
        site: "Control",
        defensor: "Aggressive",
      };
    } else {
      // Cálculo de ahorro para la siguiente ronda
      const minLossBonus = streak === 0 ? 1900 : streak === 1 ? 2400 : 2900;
      const creditsIfSave = credits + minLossBonus;

      if (creditsIfSave >= 3900 && credits < 2500) {
        // 3. ECO / SAVE (Coste CERO explícito con Classic)
        rec = {
          weapon: "Classic",
          shield: "Sin escudo",
          abilities: false,
          cost: 0,
          tactic: "Save / Eco",
          site: "Crossfire",
          defensor: "Passive",
        };
      } else {
        // 4. Force Buy / Half Buy: Spectre (1600) + Light Shields (400)
        rec = {
          weapon: "Spectre",
          shield: "Light Shields",
          abilities: true,
          cost: 2000,
          tactic: "Force Buy",
          site: "Close Quarters",
          defensor: "Hold",
        };
      }
    }

    // Estimación de la economía del equipo rival
    const isEnemyPistol = round === 1 || round === 13;
    const enemyAvgCredits = isEnemyPistol
      ? 800
      : enemyScore > 2
        ? 4200
        : 2300;
    const enemyType = isEnemyPistol
      ? "Pistol"
      : enemyAvgCredits >= 3900
        ? "Full Buy"
        : enemyAvgCredits >= 2000
          ? "Half Buy"
          : "Eco";

    const enemyEconomy: EnemyEconomyEstimate = {
      avg_credits: enemyAvgCredits,
      weapon: enemyType === "Full Buy" ? "Vandal" : enemyType === "Half Buy" ? "Spectre" : "Classic",
      shield: enemyType === "Full Buy" ? "Heavy Shields" : enemyType === "Half Buy" ? "Light Shields" : "Sin escudo",
      type: enemyType,
    };

    return {
      buy_recommendations: [rec],
      enemy_economy: enemyEconomy,
    };
  }
}
