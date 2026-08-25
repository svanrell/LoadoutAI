import * as fs from "fs";
import * as path from "path";

// ============================================================================
// CONSTANTES Y MAPEOS CANÓNICOS
// ============================================================================

export const AGENT_UUID_TO_NAME: Record<string, string> = {
  "add6443a-41bd-e414-f6ad-e58d267f4e95": "jett",
  "f94c3b30-42be-e959-889c-5aa313dba261": "raze",
  "eb93336a-449b-9c1b-0a54-a891f7921d69": "phoenix",
  "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc": "reyna",
  "7f94d92c-4234-0a36-9646-3a87eb8b5c89": "yoru",
  "bb2a4828-46eb-8cd1-e765-15848195d751": "neon",
  "0e38b510-41a8-5780-5e8f-568b2a4f2d6c": "iso",
  "df1cb487-4902-002e-5c17-d28e83e78588": "waylay",
  "320b2a48-4d9b-a075-30f1-1f93a9b638fa": "sova",
  "5f8d3a7f-467b-97f3-062c-13acf203c006": "breach",
  "6f2a04ca-43e0-be17-7f36-b3908627744d": "skye",
  "601dbbe7-43ce-be57-2a40-4abd24953621": "kayo",
  "dade69b4-4f5a-8528-247b-219e5a1facd6": "fade",
  "e370fa57-4757-3604-3648-499e1f642d3f": "gekko",
  "b444168c-4e35-8076-db47-ef9bf368f384": "tejo",
  "9f0d8ba9-4140-b941-57d3-a7ad57c6b417": "brimstone",
  "8e253930-4c05-31dd-1b6c-968525494517": "omen",
  "707eab51-4836-f488-046a-cda6bf494859": "viper",
  "41fb69c1-4189-7b37-f117-bcaf1e96f1bf": "astra",
  "95b78ed7-4637-86d9-7e41-71ba8c293152": "harbor",
  "1dbf2edd-4729-0984-3115-daa5eed44993": "clove",
  "7c8a4701-4de6-9355-b254-e09bc2a34b72": "miks",
  "1e58de9c-4950-5125-93e9-a0aee9f98746": "killjoy",
  "117ed9e3-49f3-6512-3ccf-0cada7e3823b": "cypher",
  "569fdd95-4d10-43ab-ca70-79becc718b46": "sage",
  "22697a3d-45bf-8dd7-4fec-84a9e28c69d7": "chamber",
  "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235": "deadlock",
  "efba5359-4016-a1e5-7626-b1ae76895940": "vyse",
  "92eeef5d-43b5-1d4a-8d03-b3927a09034b": "veto",
};

export const AGENT_NAME_TO_UUID: Record<string, string> = Object.entries(
  AGENT_UUID_TO_NAME,
).reduce(
  (acc, [uuid, name]) => {
    acc[name] = uuid;
    return acc;
  },
  {} as Record<string, string>,
);

export const AGENT_ROLES: Record<string, string> = {
  jett: "duelist",
  raze: "duelist",
  phoenix: "duelist",
  reyna: "duelist",
  yoru: "duelist",
  neon: "duelist",
  iso: "duelist",
  waylay: "duelist",
  sova: "initiator",
  breach: "initiator",
  skye: "initiator",
  kayo: "initiator",
  fade: "initiator",
  gekko: "initiator",
  tejo: "initiator",
  brimstone: "controller",
  omen: "controller",
  viper: "controller",
  astra: "controller",
  harbor: "controller",
  clove: "controller",
  miks: "controller",
  killjoy: "sentinel",
  cypher: "sentinel",
  sage: "sentinel",
  chamber: "sentinel",
  deadlock: "sentinel",
  vyse: "sentinel",
  veto: "sentinel",
};

export function normalizeAgentName(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim().toLowerCase();
  return AGENT_UUID_TO_NAME[cleaned] || cleaned;
}

export function getAgentRole(agentNameOrUuid: string): string {
  const canonical = normalizeAgentName(agentNameOrUuid);
  return AGENT_ROLES[canonical] || "duelist";
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export interface DraftModelData {
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
    const candidatePaths = [
      path.join(__dirname, "..", "machine_learning", "pregame", "artifacts", "draft_data.json"),
      path.join(process.cwd(), "src", "machine_learning", "pregame", "artifacts", "draft_data.json"),
      path.join(__dirname, "..", "..", "src", "machine_learning", "pregame", "artifacts", "draft_data.json"),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, "utf-8");
          this.modelData = JSON.parse(raw);
          return true;
        } catch {
          // Ignorar y probar siguiente ruta
        }
      }
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
   * Aplica suavizado de Laplace con prior neutro 50%: (victorias + 1) / (partidas + 2).
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
        // Suavizado de Laplace: evita divisiones por 0 y atenúa parejas con pocas partidas
        const smoothedWinRate =
          ((stat.wins + 1.0) / (stat.matches + 2.0)) * 100.0;
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
  public computeMapMetaScore(teamAgents: string[], targetMapName: string): number {
    const cleaned = teamAgents.map(normalizeAgentName).filter(Boolean);
    if (cleaned.length === 0 || !this.modelData) return 50.0;

    const mapKey = (targetMapName || "Ascent").trim().toLowerCase();
    const mapDict = (this.modelData.pick_rates || {})[mapKey] || {};

    const rates = cleaned.map((a) => mapDict[a] || 0.0);
    const avgPick = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0.0;
    return Math.min(95.0, Math.max(25.0, 30.0 + avgPick * 0.95));
  }

  /**
   * 4. SINERGIA GLOBAL PONDERADA
   * ----------------------------
   * Combina las 3 métricas con los pesos optimizados del modelo:
   * - 40% Armonía de Roles
   * - 35% Sinergia de Parejas
   * - 25% Meta del Mapa
   */
  public predictCompositionWinRate(
    targetMapName: string,
    currentTeamAgents: string[],
  ): number {
    const cleaned = currentTeamAgents.map(normalizeAgentName).filter(Boolean);
    if (cleaned.length === 0) return 50.0;

    const roleHarmony = this.computeMultinomialRoleHarmony(cleaned);
    const pairwiseScore = this.computePairwiseSynergy(cleaned);
    const metaScore = this.computeMapMetaScore(cleaned, targetMapName);

    const overall = 0.4 * roleHarmony + 0.35 * pairwiseScore + 0.25 * metaScore;
    return Math.round(Math.max(10.0, Math.min(98.0, overall)) * 10) / 10;
  }

  /**
   * 5. IMPACTO MARGINAL INDIVIDUAL (Delta / Δ_i)
   * --------------------------------------------
   * Calcula cuánto aporta cada agente en particular al equipo:
   * Δ_i = Sinergia(Equipo_Completo) - Sinergia(Equipo_Sin_Ese_Agente)
   * - Positivo (+5.2%): el pick potencia la composición.
   * - Negativo (-4.1%): el pick desequilibra o empeora el balance del equipo.
   */
  public computeAgentMarginalImpacts(
    targetMapName: string,
    teamAgents: string[],
  ): AgentMarginalImpact[] {
    const cleaned = teamAgents.map(normalizeAgentName).filter(Boolean);
    if (cleaned.length === 0) return [];

    const fullSynergy = this.predictCompositionWinRate(targetMapName, cleaned);

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
      const synergyWithout = this.predictCompositionWinRate(targetMapName, teamWithout);
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
   */
  public recommendAgentPicks(
    targetMapName: string,
    alreadyPickedAgents: string[],
    topLimit?: number,
  ): AgentRecommendation[] {
    if (!this.modelData) return [];

    const allAgents = this.modelData.agents || Object.values(AGENT_UUID_TO_NAME);
    const cleanedAllies = alreadyPickedAgents.map(normalizeAgentName).filter(Boolean);
    const lockedSet = new Set(cleanedAllies);
    const availableCandidates = allAgents.filter((a) => !lockedSet.has(a));

    const mapKey = (targetMapName || "Ascent").trim().toLowerCase();
    const mapPickRates = (this.modelData.pick_rates || {})[mapKey] || {};
    const pairStats = this.modelData.pair_stats || {};

    const candidateResults: AgentRecommendation[] = [];

    for (const candidate of availableCandidates) {
      const hypotheticalTeam = [...cleanedAllies, candidate];
      const roleHarmony = this.computeMultinomialRoleHarmony(hypotheticalTeam);
      const pairwiseScore = this.computePairwiseSynergy(hypotheticalTeam);
      const candidatePickRate = mapPickRates[candidate] || 0.0;
      const metaScore = Math.min(95.0, Math.max(25.0, 30.0 + candidatePickRate * 0.95));

      const composite = 0.4 * roleHarmony + 0.35 * pairwiseScore + 0.25 * metaScore;
      const finalScore = Math.round(Math.max(10.0, Math.min(99.0, composite)) * 10) / 10;

      candidateResults.push({
        agent: candidate,
        displayName: candidate.charAt(0).toUpperCase() + candidate.slice(1),
        uuid: AGENT_NAME_TO_UUID[candidate] || "",
        role: getAgentRole(candidate),
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
  ): DraftPredictionResult {
    const targetMap = mapName || "Ascent";
    const targetMode = (modeName || "competitive").trim().toLowerCase();
    const cleanedAllies = allies.map(normalizeAgentName).filter(Boolean);

    const recommendations = this.recommendAgentPicks(targetMap, cleanedAllies);
    const currentSynergy = this.predictCompositionWinRate(targetMap, cleanedAllies);
    const agentImpacts = this.computeAgentMarginalImpacts(targetMap, cleanedAllies);

    return {
      success: true,
      mapName: targetMap,
      mode: targetMode,
      currentPicks: cleanedAllies,
      enemyPicks: [],
      currentSynergy,
      recommendations,
      agentImpacts,
    };
  }
}
