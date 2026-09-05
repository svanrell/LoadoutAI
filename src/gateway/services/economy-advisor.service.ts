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
    let enemyAvgCredits = 2300;
    if (isEnemyPistol) {
      enemyAvgCredits = 800;
    } else if (enemyScore > 2) {
      enemyAvgCredits = 4200;
    }

    let enemyType = "Eco";
    if (isEnemyPistol) {
      enemyType = "Pistol";
    } else if (enemyAvgCredits >= 3900) {
      enemyType = "Full Buy";
    } else if (enemyAvgCredits >= 2000) {
      enemyType = "Half Buy";
    }

    let enemyWeapon = "Classic";
    let enemyShield = "Sin escudo";
    if (enemyType === "Full Buy") {
      enemyWeapon = "Vandal";
      enemyShield = "Heavy Shields";
    } else if (enemyType === "Half Buy") {
      enemyWeapon = "Spectre";
      enemyShield = "Light Shields";
    }

    const enemyEconomy: EnemyEconomyEstimate = {
      avg_credits: enemyAvgCredits,
      weapon: enemyWeapon,
      shield: enemyShield,
      type: enemyType,
    };

    return {
      buy_recommendations: [rec],
      enemy_economy: enemyEconomy,
    };
  }
}
