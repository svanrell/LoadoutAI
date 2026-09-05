import * as fs from "fs";
import * as path from "path";

// ============================================================================
// CONSTANTES Y MAPEOS CANÓNICOS
// ============================================================================

import {
  AGENT_UUID_TO_NAME,
  AGENT_NAME_TO_UUID,
  AGENT_ROLES,
  normalizeAgentIdentifier,
  getAgentRole,
} from "../shared/agent-constants";

export {
  AGENT_UUID_TO_NAME,
  AGENT_NAME_TO_UUID,
  AGENT_ROLES,
  normalizeAgentIdentifier,
  getAgentRole,
};

export const normalizeAgentName = normalizeAgentIdentifier;

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export interface DraftModelData {
  model_type?: string;
  weights?: Record<string, number>;
  intercept?: number;
  feature_cols?: string[];
  maps: string[];
  agents: string[];
  pick_rates: Record<string, Record<string, number>>;
  pair_stats: Record<string, { matches: number; wins: number }>;
}

export interface AgentRecommendation {
  agent: string;
  displayName: string;
  uuid: string;
  role: string;
  winRate: number;
  roleHarmony: number;
  pairwiseWinRate: number;
  metaPickRate: number;
}

export interface AgentMarginalImpact {
  agent: string;
  displayName: string;
  uuid: string;
  role: string;
  impactDelta: number;
  synergyWithout?: number;
}

export interface DraftPredictionResult {
  success: boolean;
  mapName: string;
  mode: string;
  currentPicks: string[];
  enemyPicks: string[];
  currentSynergy: number;
  recommendations: AgentRecommendation[];
  agentImpacts: AgentMarginalImpact[];
}

export class ValorantMlEngine {
  private static instance: ValorantMlEngine | null = null;
  private modelData: DraftModelData | null = null;

  constructor() {
    this.loadData();
  }

  public static getInstance(): ValorantMlEngine {
    if (!ValorantMlEngine.instance) {
      ValorantMlEngine.instance = new ValorantMlEngine();
    }
    return ValorantMlEngine.instance;
  }

  public loadData(): boolean {
    const resourcesPath = process.env.ELECTRON_RESOURCES_PATH || "";

    const candidatePaths = [
      path.join(resourcesPath, "artifacts", "draft_data.json"),
      path.join(resourcesPath, "bin", "draft_data.json"),
      path.join(resourcesPath, "draft_data.json"),
      path.join(
        resourcesPath,
        "app.asar.unpacked",
        "dist",
        "machine_learning",
        "pregame",
        "artifacts",
        "draft_data.json",
      ),
      path.join(
        __dirname,
        "machine_learning",
        "pregame",
        "artifacts",
        "draft_data.json",
      ),
      path.join(
        __dirname,
        "..",
        "machine_learning",
        "pregame",
        "artifacts",
        "draft_data.json",
      ),
      path.join(
        process.cwd(),
        "src",
        "machine_learning",
        "pregame",
        "artifacts",
        "draft_data.json",
      ),
      path.join(
        process.cwd(),
        "dist",
        "machine_learning",
        "pregame",
        "artifacts",
        "draft_data.json",
      ),
      path.join(
        __dirname,
        "..",
        "..",
        "src",
        "machine_learning",
        "pregame",
        "artifacts",
        "draft_data.json",
      ),
    ];

    for (const p of candidatePaths) {
      if (p && fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, "utf-8");
          this.modelData = JSON.parse(raw);
          return true;
        } catch {
          // Probar siguiente ruta
        }
      }
    }

    // Si no se encuentra en disco, proveer datos base por defecto para garantizar funcionamiento
    if (!this.modelData) {
      const allAgentNames = Object.values(AGENT_UUID_TO_NAME);
      this.modelData = {
        maps: [
          "Ascent",
          "Bind",
          "Haven",
          "Split",
          "Icebox",
          "Breeze",
          "Fracture",
          "Pearl",
          "Lotus",
          "Sunset",
          "Abyss",
          "Corrode",
        ],
        agents: allAgentNames,
        pick_rates: {},
        pair_stats: {},
      };
      return true;
    }

    return false;
  }

  public isLoaded(): boolean {
    return this.modelData !== null;
  }

  /**
   * 1. ARMONÍA MULTINOMIAL DE ROLES
   * ---------------------------------
   * Evalúa qué tan equilibrada está la distribución de roles (Duelista, Iniciador, Controlador, Centinela).
   * Usa la distribución Multinomial con probabilidad equitativa p = 0.25 para cada rol:
   * P(n_d, n_i, n_c, n_s) = (k! / (n_d! * n_i! * n_c! * n_s!)) * (0.25^k)
   * Devuelve un valor normalizado entre 5% y 100%.
   */
  public computeMultinomialRoleHarmony(teamAgents: string[]): number {
    const cleaned = teamAgents.map(normalizeAgentName).filter(Boolean);
    const k = cleaned.length;
    if (k === 0) return 50.0; // Valor neutro por defecto

    const roles = cleaned.map(getAgentRole);
    const nd = roles.filter((r) => r === "duelist").length;
    const ni = roles.filter((r) => r === "initiator").length;
    const nc = roles.filter((r) => r === "controller").length;
    const ns = roles.filter((r) => r === "sentinel").length;

    // Coeficiente combinatorio multinomial
    const multinomialCoeff =
      factorial(k) /
      (factorial(nd) * factorial(ni) * factorial(nc) * factorial(ns));
    const observedProb = multinomialCoeff * Math.pow(0.25, k);

    // Máximas probabilidades teóricas para normalizar a escala 0 - 100%
    const maxProbs: Record<number, number> = {
      1: 0.25,
      2: 0.125,
      3: 0.09375,
      4: 0.09375,
      5: 0.05859375,
    };
    const maxP = maxProbs[k] || 0.05859375;
    const normalized = (observedProb / maxP) * 100.0;
    return Math.max(5.0, Math.min(100.0, normalized));
  }

  /**
   * 2. SINERGIA EMPÍRICA DE PAREJAS (Laplace Smoothing Bayesiano)
   * -------------------------------------------------------------
   * Calcula el porcentaje medio de victoria de todas las parejas posibles en el equipo
   * a partir de datos reales de partidas.
   * Aplica suavizado bayesiano con prior neutro M=6.0 hacia 50%: (victorias + 3) / (partidas + 6).
   */
  public computePairwiseSynergy(teamAgents: string[]): number {
    const cleaned = teamAgents.map(normalizeAgentName).filter(Boolean);
    const k = cleaned.length;
    if (k < 2 || !this.modelData) return 50.0;

    const pairStats = this.modelData.pair_stats || {};
    const pairScores: number[] = [];

    // Recorremos todas las combinaciones de 2 agentes en el equipo
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        const pairKey = [cleaned[i], cleaned[j]].sort().join("__");
        const stat = pairStats[pairKey] || { matches: 0, wins: 0 };
        // Suavizado Bayesiano: prior M=6 hacia 50%
        const smoothedWinRate =
          ((stat.wins + 3.0) / (stat.matches + 6.0)) * 100.0;
        pairScores.push(smoothedWinRate);
      }
    }

    if (pairScores.length === 0) return 50.0;
    const avg = pairScores.reduce((a, b) => a + b, 0) / pairScores.length;
    return avg;
  }

  /**
   * 3. PUNTUACIÓN DE META DEL MAPA
   * ------------------------------
   * Mide la tasa media de uso y efectividad de los agentes elegidos en el mapa concreto.
   */
  public computeMapMetaScore(
    teamAgents: string[],
    targetMapName: string,
  ): number {
    const cleaned = teamAgents.map(normalizeAgentName).filter(Boolean);
    if (cleaned.length === 0 || !this.modelData) return 50.0;

    const mapKey = (targetMapName || "Ascent").trim().toLowerCase();
    const mapDict = (this.modelData.pick_rates || {})[mapKey] || {};

    const rates = cleaned.map((a) => mapDict[a] || 0.0);
    const avgPick =
      rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0.0;
    return Math.min(80.0, Math.max(35.0, 42.0 + avgPick * 0.35));
  }

  /**
   * 4. INFERENCIA DEL MODELO DE REGRESIÓN LOGÍSTICA
   * ------------------------------------------------
   * Evalúa los pesos entrenados por Scikit-Learn directamente en TypeScript.
   * Utiliza la matriz de diferencias:
   * z = intercept + w_map + sum(w_diff_allies) - sum(w_diff_enemies)
   * Probabilidad: P(win) = 1 / (1 + e^-z)
   */
  public predictLogisticRegression(
    targetMapName: string,
    allyAgents: string[],
    enemyAgents: string[] = [],
  ): number {
    if (
      !this.modelData?.weights ||
      Object.keys(this.modelData.weights).length === 0
    ) {
      return 50.0;
    }

    const weights = this.modelData.weights;
    const intercept = this.modelData.intercept || 0.0;
    let z = intercept;

    // Aportación del mapa
    const mapKey = `map_${(targetMapName || "Ascent").trim()}`;
    if (weights[mapKey] !== undefined) {
      z += weights[mapKey];
    }

    // Aportación de aliados (+1 en vector de diferencia)
    const cleanedAllies = allyAgents.map(normalizeAgentName).filter(Boolean);
    for (const a of cleanedAllies) {
      const diffKey = `diff_${a}`;
      if (weights[diffKey] !== undefined) {
        z += weights[diffKey];
      }
    }

    // Aportación de rivales (-1 en vector de diferencia)
    const cleanedEnemies = enemyAgents.map(normalizeAgentName).filter(Boolean);
    for (const e of cleanedEnemies) {
      const diffKey = `diff_${e}`;
      if (weights[diffKey] !== undefined) {
        z -= weights[diffKey];
      }
    }

    // Función sigmoide logit
    const prob = 1.0 / (1.0 + Math.exp(-z));
    return Math.round(Math.max(15.0, Math.min(95.0, prob * 100.0)) * 10) / 10;
  }

  /**
   * 5. SINERGIA GLOBAL PONDERADA
   * ----------------------------
   * Combina el modelo estadístico ML con sinergia empírica de parejas y armonía:
   * - 40% Modelo Logistic Regression (incluye enemigos y mapa)
   * - 20% Meta del Mapa
   * - 20% Sinergia de Parejas (Bayesiano)
   * - 20% Armonía y Balance de Roles
   */
  public predictCompositionWinRate(
    targetMapName: string,
    currentTeamAgents: string[],
    enemyTeamAgents: string[] = [],
  ): number {
    const cleanedAllies = currentTeamAgents
      .map(normalizeAgentName)
      .filter(Boolean);
    if (cleanedAllies.length === 0) return 50.0;

    const lrScore = this.predictLogisticRegression(
      targetMapName,
      cleanedAllies,
      enemyTeamAgents,
    );
    const roleHarmony = this.computeMultinomialRoleHarmony(cleanedAllies);
    const pairwiseScore = this.computePairwiseSynergy(cleanedAllies);
    const metaScore = this.computeMapMetaScore(cleanedAllies, targetMapName);

    const overall =
      0.4 * lrScore + 0.2 * metaScore + 0.2 * pairwiseScore + 0.2 * roleHarmony;
    return Math.round(Math.max(15.0, Math.min(95.0, overall)) * 10) / 10;
  }

  /**
   * 6. IMPACTO MARGINAL INDIVIDUAL (Delta / Δ_i)
   * --------------------------------------------
   * Calcula cuánto aporta cada agente en particular al equipo:
   * Δ_i = Sinergia(Equipo_Completo) - Sinergia(Equipo_Sin_Ese_Agente)
   */
  public computeAgentMarginalImpacts(
    targetMapName: string,
    teamAgents: string[],
    enemyTeamAgents: string[] = [],
  ): AgentMarginalImpact[] {
    const cleaned = teamAgents.map(normalizeAgentName).filter(Boolean);
    if (cleaned.length === 0) return [];

    const fullSynergy = this.predictCompositionWinRate(
      targetMapName,
      cleaned,
      enemyTeamAgents,
    );

    if (cleaned.length === 1) {
      const agentName = cleaned[0];
      const delta = Math.round((fullSynergy - 50.0) * 10) / 10;
      return [
        {
          agent: agentName,
          displayName: agentName.charAt(0).toUpperCase() + agentName.slice(1),
          uuid: AGENT_NAME_TO_UUID[agentName] || "",
          role: getAgentRole(agentName),
          impactDelta: delta,
        },
      ];
    }

    const impacts: AgentMarginalImpact[] = [];
    for (let i = 0; i < cleaned.length; i++) {
      const agentName = cleaned[i];
      const teamWithout = cleaned.filter((_, idx) => idx !== i);
      const synergyWithout = this.predictCompositionWinRate(
        targetMapName,
        teamWithout,
        enemyTeamAgents,
      );
      const delta = Math.round((fullSynergy - synergyWithout) * 10) / 10;

      impacts.push({
        agent: agentName,
        displayName: agentName.charAt(0).toUpperCase() + agentName.slice(1),
        uuid: AGENT_NAME_TO_UUID[agentName] || "",
        role: getAgentRole(agentName),
        impactDelta: delta,
        synergyWithout,
      });
    }

    return impacts;
  }

  /**
   * Recomendación de candidatos ordenada por sinergia
   * Calibrada con el modelo real y considerando composición enemiga
   */
  public recommendAgentPicks(
    targetMapName: string,
    alreadyPickedAgents: string[],
    enemyPickedAgents: string[] = [],
    topLimit?: number,
  ): AgentRecommendation[] {
    if (!this.modelData) return [];

    const allAgents =
      this.modelData.agents || Object.values(AGENT_UUID_TO_NAME);
    const cleanedAllies = alreadyPickedAgents
      .map(normalizeAgentName)
      .filter(Boolean);
    const cleanedEnemies = enemyPickedAgents
      .map(normalizeAgentName)
      .filter(Boolean);
    const lockedSet = new Set([...cleanedAllies, ...cleanedEnemies]);
    const availableCandidates = allAgents.filter((a) => !lockedSet.has(a));

    const mapKey = (targetMapName || "Ascent").trim().toLowerCase();
    const mapPickRates = (this.modelData.pick_rates || {})[mapKey] || {};

    const candidateResults: AgentRecommendation[] = [];
    const isInitialDraft = cleanedAllies.length === 0;

    const lockedRoles = cleanedAllies.map(getAgentRole);
    const hasController = lockedRoles.includes("controller");
    const hasDuelist = lockedRoles.includes("duelist");

    for (const candidate of availableCandidates) {
      const hypotheticalTeam = [...cleanedAllies, candidate];
      const candidatePickRate = mapPickRates[candidate] || 0.0;
      const cRole = getAgentRole(candidate);

      const lrScore = this.predictLogisticRegression(
        targetMapName,
        hypotheticalTeam,
        cleanedEnemies,
      );

      let roleHarmony = 50.0;
      let pairwiseScore = 50.0;
      let composite = 50.0;

      if (isInitialDraft && cleanedEnemies.length === 0) {
        composite = lrScore * 0.5 + (43.0 + candidatePickRate * 0.18) * 0.5;
      } else {
        roleHarmony = this.computeMultinomialRoleHarmony(hypotheticalTeam);
        pairwiseScore = this.computePairwiseSynergy(hypotheticalTeam);
        const candidateMeta = 42.0 + candidatePickRate * 0.35;

        let roleScore = 50.0 + (roleHarmony - 50.0) * 0.4;
        if (!hasController && cRole === "controller") {
          roleScore += 8.0; // Necesidad de humos
        } else if (!hasDuelist && cRole === "duelist") {
          roleScore += 4.0;
        }

        composite =
          0.35 * lrScore +
          0.25 * candidateMeta +
          0.2 * pairwiseScore +
          0.2 * roleScore;
      }

      const finalScore =
        Math.round(Math.max(15.0, Math.min(95.0, composite)) * 10) / 10;

      candidateResults.push({
        agent: candidate,
        displayName: candidate.charAt(0).toUpperCase() + candidate.slice(1),
        uuid: AGENT_NAME_TO_UUID[candidate] || "",
        role: cRole,
        winRate: finalScore,
        roleHarmony: Math.round(roleHarmony * 10) / 10,
        pairwiseWinRate: Math.round(pairwiseScore * 10) / 10,
        metaPickRate: Math.round(candidatePickRate * 10) / 10,
      });
    }

    candidateResults.sort((a, b) => b.winRate - a.winRate);
    return topLimit ? candidateResults.slice(0, topLimit) : candidateResults;
  }

  /**
   * Endpoint de predicción completa
   */
  public predict(
    mapName: string,
    allies: string[],
    modeName: string = "competitive",
    enemies: string[] = [],
  ): DraftPredictionResult {
    const targetMap = mapName || "Ascent";
    const targetMode = (modeName || "competitive").trim().toLowerCase();
    const cleanedAllies = allies.map(normalizeAgentName).filter(Boolean);
    const cleanedEnemies = enemies.map(normalizeAgentName).filter(Boolean);

    const recommendations = this.recommendAgentPicks(
      targetMap,
      cleanedAllies,
      cleanedEnemies,
    );
    const currentSynergy = this.predictCompositionWinRate(
      targetMap,
      cleanedAllies,
      cleanedEnemies,
    );
    const agentImpacts = this.computeAgentMarginalImpacts(
      targetMap,
      cleanedAllies,
      cleanedEnemies,
    );

    return {
      success: true,
      mapName: targetMap,
      mode: targetMode,
      currentPicks: cleanedAllies,
      enemyPicks: cleanedEnemies,
      currentSynergy,
      recommendations,
      agentImpacts,
    };
  }
}
