/**
 * pregameLogic.ts
 * ===============
 * Funciones puras y lógica de negocio para la vista Pre-Game (Draft y Sinergia).
 * Desacopladas de los componentes visuales de React para una arquitectura limpia.
 */

import { Agent } from "@/hooks/useValorantData";
import { Player, MLDraftRecommendation, MLAgentImpact } from "@/hooks/useGameState";

/**
 * Normaliza nombres para comparación insensible a mayúsculas, espacios y caracteres especiales.
 */
export function normalizeNameKey(name: string): string {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Construye un mapa en O(1) de agentes indexados por UUID en minúsculas.
 */
export function buildAgentByUuidMap(agents: Agent[]): Map<string, Agent> {
  const map = new Map<string, Agent>();
  for (const agent of agents) {
    map.set(agent.uuid.toLowerCase(), agent);
  }
  return map;
}

/**
 * Construye un mapa en O(1) de agentes indexados por nombre normalizado
 * (normalizeNameKey: "KAY/O" y "kayo" dan la misma clave).
 */
export function buildAgentByNameKeyMap(agents: Agent[]): Map<string, Agent> {
  const map = new Map<string, Agent>();
  for (const agent of agents) {
    const key = normalizeNameKey(agent.displayName);
    if (key) map.set(key, agent);
  }
  return map;
}

/**
 * Agente del catálogo que corresponde a una recomendación de la IA:
 * primero por UUID y, si no hay o no coincide, por nombre normalizado.
 */
export function findAgentForRecommendation(
  recommendation: MLDraftRecommendation,
  agentByUuidMap: Map<string, Agent>,
  agentByNameKeyMap: Map<string, Agent>
): Agent | undefined {
  return (
    (recommendation.uuid ? agentByUuidMap.get(recommendation.uuid.toLowerCase()) : undefined) ||
    agentByNameKeyMap.get(normalizeNameKey(recommendation.agent || recommendation.displayName))
  );
}

/**
 * Busca el impacto (Δ) de un agente por UUID o por nombre normalizado en O(1).
 */
export function getAgentImpact(
  impactMap: Map<string, MLAgentImpact>,
  agentUuid: string,
  agentDisplayName: string
): MLAgentImpact | null {
  return (
    impactMap.get(agentUuid.toLowerCase()) ||
    (agentDisplayName ? impactMap.get(normalizeNameKey(agentDisplayName)) : undefined) ||
    null
  );
}

/**
 * Construye un mapa de recomendaciones de IA indexado por UUID y por nombre normalizado.
 */
export function buildRecommendationsMap(
  mlRecommendations: MLDraftRecommendation[] | null
): Map<string, MLDraftRecommendation> {
  const map = new Map<string, MLDraftRecommendation>();
  if (!mlRecommendations) return map;

  for (const rec of mlRecommendations) {
    if (rec.uuid) {
      map.set(rec.uuid.toLowerCase(), rec);
    }
    const nameKey = normalizeNameKey(rec.agent || rec.displayName);
    if (nameKey) {
      map.set(nameKey, rec);
    }
  }
  return map;
}

/**
 * Construye un mapa de impacto de agentes indexado por UUID y por nombre normalizado.
 */
export function buildImpactMap(
  mlAgentImpacts: MLAgentImpact[] | null
): Map<string, MLAgentImpact> {
  const map = new Map<string, MLAgentImpact>();
  if (!mlAgentImpacts) return map;

  for (const imp of mlAgentImpacts) {
    if (imp.uuid) {
      map.set(imp.uuid.toLowerCase(), imp);
    }
    const nameKey = normalizeNameKey(imp.agent || imp.displayName);
    if (nameKey) {
      map.set(nameKey, imp);
    }
  }
  return map;
}

/**
 * Busca la recomendación de la IA para un agente dado por UUID o nombre en O(1).
 */
export function getAgentRecommendation(
  recMap: Map<string, MLDraftRecommendation>,
  agentUuid: string,
  agentDisplayName: string
): MLDraftRecommendation | null {
  return (
    recMap.get(agentUuid.toLowerCase()) ||
    recMap.get(normalizeNameKey(agentDisplayName)) ||
    null
  );
}

/**
 * Filtra los agentes por categoría de rol y los ordena de mayor a menor probabilidad de victoria.
 */
export function filterAndSortAgents(
  agents: Agent[],
  selectedRoleCategory: string,
  recMap: Map<string, MLDraftRecommendation>
): Agent[] {
  return agents
    .filter((agent) => {
      if (selectedRoleCategory === "all") return true;
      return agent.role?.displayName.toLowerCase() === selectedRoleCategory.toLowerCase();
    })
    .sort((agentA, agentB) => {
      const recA = getAgentRecommendation(recMap, agentA.uuid, agentA.displayName);
      const recB = getAgentRecommendation(recMap, agentB.uuid, agentB.displayName);
      const winRateA = recA ? recA.winRate : 0;
      const winRateB = recB ? recB.winRate : 0;
      return winRateB - winRateA;
    });
}

/**
 * Obtiene los jugadores del equipo que ya han seleccionado un agente
 * (pre-pick o bloqueado).
 */
export function getPickedPlayers(myTeam: Player[]): Player[] {
  return myTeam.filter((player) => Boolean(player.agentId && player.agentId.trim() !== ""));
}

/**
 * Jugadores que han bloqueado su agente. Un pre-pick ("selected") no cuenta.
 */
export function getLockedPlayers(myTeam: Player[]): Player[] {
  return getPickedPlayers(myTeam).filter((player) => player.state === "locked");
}

/**
 * Situación de un agente en el equipo:
 * - "free": nadie lo tiene.
 * - "onTeam": alguien lo tiene en pre-pick (también puede ser el propio jugador);
 *   todavía se puede bloquear.
 * - "locked": alguien lo ha bloqueado; ya no se puede elegir.
 */
export type AgentTeamStatus = "free" | "onTeam" | "locked";

export function getAgentTeamStatus(myTeam: Player[], agentUuid: string): AgentTeamStatus {
  const uuid = agentUuid.toLowerCase();
  const holders = myTeam.filter((player) => (player.agentId || "").toLowerCase() === uuid);
  if (holders.length === 0) return "free";
  return holders.some((player) => player.state === "locked") ? "locked" : "onTeam";
}

/**
 * Resuelve los objetos de Agente a partir de los jugadores que ya han elegido.
 */
export function getPickedAgentsList(
  pickedPlayers: Player[],
  agentByUuidMap: Map<string, Agent>
): Agent[] {
  return pickedPlayers
    .map((player) => agentByUuidMap.get((player.agentId || "").toLowerCase()))
    .filter((agent): agent is Agent => Boolean(agent));
}

/**
 * Determina si el draft se ha completado: los 5 jugadores han bloqueado su agente.
 * Recibe el número de jugadores bloqueados (getLockedPlayers), no el de pre-picks.
 */
export function isDraftCompleted(lockedCount: number): boolean {
  return lockedCount >= 5;
}
