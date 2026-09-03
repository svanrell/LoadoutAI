"use client";

import { useState, useMemo } from "react";
import { useValorantData } from "@/hooks/useValorantData";
import { useGameState, MLDraftRecommendation } from "@/hooks/useGameState";
import { useLanguage } from "@/context/LanguageContext";
import { getScoreMeta } from "@/lib/scoreUtils";
import { getGameModeName } from "@/data/gameModesData";
import {
  buildAgentByUuidMap,
  buildRecommendationsMap,
  buildImpactMap,
  getAgentRecommendation,
  filterAndSortAgents,
  getPickedPlayers,
  getPickedAgentsList,
  isDraftCompleted,
} from "@/lib/pregameLogic";

// ============================================================================
// VISTA PRE-GAME: ASISTENTE DE DRAFT Y COACH DE SINERGIA CON IA
// ============================================================================

export default function ViewPregame() {
  // 1. Catálogo completo de agentes oficiales obtenidos desde la API de Valorant
  const { agents, loading: isLoadingAgents } = useValorantData();

  // 2. Estado de la partida detectado por el radar local de Valorant
  const {
    selectedMap,
    selectedMode,
    myTeam,
    selectAgent,
    lockAgent,
    mlRecommendations, // Lista de agentes recomendados por la IA con % de victoria
    mlSynergyWinRate,  // Sinergia global actual del equipo (0% a 100%)
    mlAgentImpacts,    // Aporte neto individual (Δ delta) de cada pick
    setView,
  } = useGameState();
  const { t, language } = useLanguage();

  // 3. Filtros locales del usuario: categoría de rol (todos, duelista, etc.) y agente seleccionado en pantalla
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>("all");
  const [selectedAgentUuid, setSelectedAgentUuid] = useState<string | null>(null);

  // useMemo (Mapa 1): Indexa los agentes por UUID para buscarlos en O(1) instantáneo
  const agentByUuidMap = useMemo(() => buildAgentByUuidMap(agents), [agents]);

  // useMemo (Mapa 2): Indexa las recomendaciones de la IA por UUID y nombre para evitar búsquedas lentas
  const recMap = useMemo(() => buildRecommendationsMap(mlRecommendations), [mlRecommendations]);

  // useMemo (Mapa 3): Indexa los impactos individuales (deltas ▲/▼) de cada agente
  const impactMap = useMemo(() => buildImpactMap(mlAgentImpacts), [mlAgentImpacts]);

  // Jugadores del equipo que ya han elegido un personaje
  const pickedPlayers = useMemo(() => getPickedPlayers(myTeam), [myTeam]);
  const pickedAgentsCount = pickedPlayers.length;
  // Cuando hay 5 agentes seleccionados, el draft se da por completado
  const isDraftComplete = isDraftCompleted(pickedAgentsCount);

  // useMemo: Lista de agentes ya elegidos por el equipo para el resumen final
  const pickedAgentsList = useMemo(
    () => getPickedAgentsList(pickedPlayers, agentByUuidMap),
    [pickedPlayers, agentByUuidMap]
  );

  // Helper O(1) para buscar la recomendación de la IA para un agente dado
  const getAgentRec = (agentUuid: string, agentDisplayName: string) =>
    getAgentRecommendation(recMap, agentUuid, agentDisplayName);

  // Filtrar y ordenar los agentes de forma memoizada en O(1) por comparación
  const filteredAgents = useMemo(
    () => filterAndSortAgents(agents, selectedRoleCategory, recMap),
    [agents, selectedRoleCategory, recMap]
  );

  const selectedAgent = agentByUuidMap.get(selectedAgentUuid?.toLowerCase() || "");

  const roleCategoryLabels: Record<string, string> = {
    all: t.allRoles,
    duelist: t.duelists,
    initiator: t.initiators,
    controller: t.controllers,
    sentinel: t.sentinels,
  };

  return (
    <div id="viewPregame" className="state-view active">
      {/* Column 1: Team Configuration */}
      <div className="cyber-panel pregame-team-panel" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div className="panel-header" style={{ flexShrink: 0 }}>
          <span>{t.myTeamComposition}</span>
          <span id="teamCount" className="accent">
            {pickedAgentsCount} / {myTeam.length} {t.picked}
          </span>
        </div>

        <div
          className="team-list"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "clamp(0.45rem, 1.1vh, 0.8rem)",
            padding: "clamp(0.55rem, 1.3vh, 0.95rem)",
            flex: 1,
            height: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {myTeam.map((player, playerIndex) => {
            const matchedAgent = player.agentId
              ? agentByUuidMap.get(player.agentId.toLowerCase()) || null
              : null;

            const displayAgentName = matchedAgent ? matchedAgent.displayName : t.selecting;

            const agentImpact = player.agentId
              ? impactMap.get(player.agentId.toLowerCase()) ||
                (matchedAgent
                  ? impactMap.get(
                      matchedAgent.displayName.toLowerCase().replace(/[^a-z0-9]/g, "")
                    )
                  : null)
              : null;

            let playerStatusLabel = t.openStatus;
            let playerStatusCssClass = "status-open";

            if (player.state === "locked") {
              playerStatusLabel = t.lockedStatus;
              playerStatusCssClass = "status-locked";
            } else if (player.state === "selected") {
              playerStatusLabel = t.prepickStatus;
              playerStatusCssClass = "status-prepick";
            }

            const displayPlayerName =
              player.name === "You" ? t.you : player.name.replace(/^Ally\s*/i, `${t.ally} `);

            return (
              <div
                key={player.puuid || playerIndex}
                className={`player-card ${player.state === "locked" ? "locked" : ""} ${player.state === "selected" ? "selecting" : ""}`}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "clamp(0.65rem, 1.2vw, 1rem)",
                  padding: "clamp(0.45rem, 0.9vh, 0.75rem) clamp(0.65rem, 1.2vw, 0.95rem)",
                  borderRadius: "0.35rem",
                  boxSizing: "border-box",
                  minHeight: "clamp(3.6rem, 8.5vh, 5.8rem)",
                  ...(player.playerCardId && player.playerCardId !== "locked"
                    ? {
                        backgroundImage: `linear-gradient(rgba(11, 18, 25, 0.85), rgba(11, 18, 25, 0.95)), url(https://media.valorant-api.com/playercards/${player.playerCardId}/wideart.png)`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}),
                }}
              >
                <div
                  className="player-index"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "clamp(0.85rem, 1.2vw, 1.1rem)",
                    fontWeight: 900,
                    color: "var(--text-muted)",
                    minWidth: "1.1rem",
                  }}
                >
                  {playerIndex + 1}
                </div>

                <div
                  className="player-avatar-wrap"
                  style={{
                    width: "clamp(2.8rem, 6vh, 4rem)",
                    height: "clamp(2.8rem, 6vh, 4rem)",
                    minWidth: "clamp(2.8rem, 6vh, 4rem)",
                    minHeight: "clamp(2.8rem, 6vh, 4rem)",
                    borderRadius: "0.35rem",
                    border: "1px solid var(--border-cyber)",
                    background: "rgba(0, 0, 0, 0.4)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {matchedAgent ? (
                    <img
                      src={matchedAgent.displayIcon}
                      alt={matchedAgent.displayName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ width: "50%", height: "50%", stroke: "var(--text-muted)" }}
                    >
                      <circle cx="12" cy="7" r="4"></circle>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    </svg>
                  )}
                </div>

                <div className="player-info" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: 0 }}>
                  <div
                    className="player-name"
                    style={{
                      fontSize: "clamp(0.85rem, 1.1vw, 1.05rem)",
                      fontWeight: 700,
                      color: "var(--text-main)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: 1.2,
                    }}
                  >
                    {displayPlayerName}
                  </div>
                  <div
                    className="player-agent"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: matchedAgent
                        ? "clamp(0.68rem, 0.9vw, 0.82rem)"
                        : "clamp(0.52rem, 0.68vw, 0.62rem)",
                      fontWeight: 900,
                      color: "var(--color-cyan)",
                      letterSpacing: matchedAgent ? "0.03em" : "0.01em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: 1.2,
                    }}
                  >
                    {displayAgentName}
                  </div>
                  <div className="player-meta" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.15rem" }}>
                    <span
                      className="player-level"
                      style={{
                        fontSize: "clamp(0.55rem, 0.7vw, 0.65rem)",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      {t.lvl} {player.level || "--"}
                    </span>
                    <span
                      className={`status-badge-inner ${playerStatusCssClass}`}
                      style={{
                        fontSize: "clamp(0.52rem, 0.68vw, 0.62rem)",
                        fontWeight: 800,
                        padding: "0.15rem 0.45rem",
                        borderRadius: "0.2rem",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {playerStatusLabel}
                    </span>
                    {agentImpact && typeof agentImpact.impactDelta === "number" && (
                      <span
                        title={`Aporte a la sinergia del equipo: ${agentImpact.impactDelta > 0 ? "+" : ""}${agentImpact.impactDelta.toFixed(1)}%`}
                        style={{
                          fontSize: "clamp(0.52rem, 0.68vw, 0.62rem)",
                          fontFamily: "'Orbitron', sans-serif",
                          fontWeight: 800,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "0.2rem",
                          letterSpacing: "0.04em",
                          color:
                            agentImpact.impactDelta > 0
                              ? "#00ff88"
                              : agentImpact.impactDelta < 0
                              ? "#ff4655"
                              : "var(--color-cyan)",
                          background:
                            agentImpact.impactDelta > 0
                              ? "rgba(0, 255, 136, 0.12)"
                              : agentImpact.impactDelta < 0
                              ? "rgba(255, 70, 85, 0.15)"
                              : "rgba(0, 243, 255, 0.1)",
                          border: `1px solid ${
                            agentImpact.impactDelta > 0
                              ? "rgba(0, 255, 136, 0.35)"
                              : agentImpact.impactDelta < 0
                              ? "rgba(255, 70, 85, 0.4)"
                              : "rgba(0, 243, 255, 0.25)"
                          }`,
                        }}
                      >
                        {agentImpact.impactDelta > 0
                          ? `▲ +${agentImpact.impactDelta.toFixed(1)}%`
                          : agentImpact.impactDelta < 0
                          ? `▼ ${agentImpact.impactDelta.toFixed(1)}%`
                          : `~ 0.0%`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Column 2: Dashboard */}
      <div className="dashboard-col" style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0.75rem" }}>
        <div className="ai-rec-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "stretch" }}>
          {/* Team Synergy Gauge */}
          <div className="cyber-panel synergy-card" style={{ padding: "0.75rem 0.875rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div
              className="panel-header"
              style={{
                width: "100%",
                borderBottom: "none",
                background: "transparent",
                padding: "0 0 0.2rem 0",
              }}
            >
              <span>{t.teamSynergyAnalyzer}</span>
              <span className="accent" style={{ fontSize: "0.6875rem" }}>
                {selectedMap.toUpperCase()}
              </span>
            </div>

            {(() => {
              const rawWinRate = mlSynergyWinRate || 50;
              const scoreMeta = getScoreMeta(rawWinRate, true, language);
              const synergyScorePercent = Math.min(100, Math.max(0, Math.round(rawWinRate)));
              const strokeOffsetValue = Math.max(
                0,
                204.2 - (204.2 * (scoreMeta.score * 10)) / 100
              );

              const compositionRatingText = `${scoreMeta.grade} • ${scoreMeta.label.toUpperCase()}`;
              const compositionThemeColor = scoreMeta.color;

              return (
                <>
                  <div className="synergy-gauge-container" style={{ margin: "0.15rem 0 0.35rem 0" }}>
                    <svg style={{ width: "10.625rem", height: "5.625rem" }} viewBox="0 0 170 90">
                      <path className="synergy-ring-bg" d="M 20,82 A 65,65 0 0,1 150,82" />
                      <path
                        className="synergy-ring-fill"
                        d="M 20,82 A 65,65 0 0,1 150,82"
                        style={{
                          strokeDasharray: "204.2",
                          strokeDashoffset: strokeOffsetValue,
                          stroke: compositionThemeColor,
                        }}
                      />
                    </svg>
                    <div
                      className="synergy-value"
                      style={{ color: compositionThemeColor, fontSize: "2.25rem" }}
                    >
                      {scoreMeta.score.toFixed(1)}
                    </div>
                  </div>

                  <div className="synergy-feedback" style={{ marginTop: "0.15rem" }}>
                    <div
                      className="synergy-rating"
                      style={{ color: compositionThemeColor, fontSize: "0.8125rem", fontWeight: 800, letterSpacing: "0.06em" }}
                    >
                      {compositionRatingText}
                    </div>
                    <div className="synergy-analysis-box" style={{ marginTop: "0.25rem", padding: "0.5rem 0.75rem" }}>
                      <div className="synergy-analysis-item" style={{ fontSize: "0.72rem" }}>
                        <strong className="strong-label" style={{ fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}>{t.picksLocked}</strong>
                        <span className="synergy-analysis-text">
                          {pickedAgentsCount} {t.of5Agents}
                        </span>
                      </div>
                      <div className="synergy-analysis-item" style={{ fontSize: "0.72rem" }}>
                        <strong className="weak-label" style={{ fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}>{t.winRateEstimated}</strong>
                        <span className="synergy-analysis-text" style={{ color: compositionThemeColor, fontWeight: 700 }}>
                          {synergyScorePercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* AI Recommended Picks Panel OR Completed Team Summary */}
          <div className="cyber-panel" style={{ padding: "0.75rem 0.875rem", display: "flex", flexDirection: "column" }}>
            <div
              className="panel-header"
              style={{
                width: "100%",
                padding: "0 0 0.375rem 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "none",
                background: "transparent",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span style={{ color: "#00ff88", fontWeight: "bold" }}>●</span>{" "}
                {isDraftComplete ? t.draftCompleted : t.aiDraftCoach}
              </span>
              <span
                style={{
                  fontSize: "0.625rem",
                  color: isDraftComplete ? "#00ff88" : "var(--color-cyan)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: "bold",
                }}
              >
                {isDraftComplete ? t.draftFinished : t.top5PicksGlobal}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.25rem" }}>
              {isDraftComplete ? (
                /* Locked 5 Agents Summary */
                pickedAgentsList.map((agent, rankIndex) => (
                  <div
                    key={agent.uuid || rankIndex}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.4rem 0.75rem",
                      background: "rgba(15, 25, 35, 0.75)",
                      border: "1px solid rgba(0, 255, 136, 0.25)",
                      borderRadius: "0.25rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <span
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: "0.6875rem",
                          fontWeight: "bold",
                          color: "#00ff88",
                          width: "1.125rem",
                        }}
                      >
                        #{rankIndex + 1}
                      </span>
                      <img
                        src={agent.displayIcon}
                        alt={agent.displayName}
                        style={{
                          width: "1.75rem",
                          height: "1.75rem",
                          borderRadius: "0.25rem",
                          objectFit: "cover",
                        }}
                      />
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#fff", lineHeight: 1.2 }}>
                          {agent.displayName}
                        </div>
                        <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", lineHeight: 1.1 }}>
                          {agent.role?.displayName || "Agent"}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: 800,
                        color: "#00ff88",
                        padding: "0.15rem 0.5rem",
                        background: "rgba(0, 255, 136, 0.12)",
                        borderRadius: "0.2rem",
                        border: "1px solid rgba(0, 255, 136, 0.3)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {t.fixed}
                    </span>
                  </div>
                ))
              ) : mlRecommendations && mlRecommendations.length > 0 ? (
                mlRecommendations.slice(0, 5).map((recommendation: MLDraftRecommendation, rankIndex: number) => {
                  const targetAgent =
                    typeof recommendation === "object" && recommendation.uuid
                      ? agents.find(
                          (agent) =>
                            agent.uuid.toLowerCase() === recommendation.uuid.toLowerCase() ||
                            agent.displayName.toLowerCase() === recommendation.agent.toLowerCase()
                        )
                      : agents.find(
                          (agent) =>
                            agent.displayName.toLowerCase() === String(recommendation).toLowerCase()
                        );

                  const targetAgentName = targetAgent
                    ? targetAgent.displayName
                    : typeof recommendation === "object"
                    ? recommendation.displayName || recommendation.agent
                    : String(recommendation);

                  const estimatedWinRate =
                    typeof recommendation === "object" && recommendation.winRate
                      ? recommendation.winRate
                      : null;

                  const targetRoleName = targetAgent?.role?.displayName || "Agent";

                  return (
                    <div
                      key={rankIndex}
                      onClick={() => {
                        if (targetAgent) {
                          setSelectedAgentUuid(targetAgent.uuid);
                          selectAgent(targetAgent.uuid);
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.45rem 0.75rem",
                        background: "rgba(15, 25, 35, 0.75)",
                        border: "1px solid rgba(0, 243, 255, 0.18)",
                        borderRadius: "0.25rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.borderColor = "var(--color-cyan)";
                        event.currentTarget.style.background = "rgba(0, 243, 255, 0.1)";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.borderColor = "rgba(0, 243, 255, 0.18)";
                        event.currentTarget.style.background = "rgba(15, 25, 35, 0.75)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: "0.6875rem",
                            fontWeight: "bold",
                            color: rankIndex === 0 ? "#ffd700" : "var(--text-muted)",
                            width: "1.125rem",
                          }}
                        >
                          #{rankIndex + 1}
                        </span>

                        {targetAgent?.displayIcon ? (
                          <img
                            src={targetAgent.displayIcon}
                            alt={targetAgentName}
                            style={{
                              width: "1.75rem",
                              height: "1.75rem",
                              borderRadius: "0.25rem",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "1.75rem",
                              height: "1.75rem",
                              background: "#1b2733",
                              borderRadius: "0.25rem",
                            }}
                          />
                        )}

                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#fff", lineHeight: 1.2 }}>
                            {targetAgentName}
                          </div>
                          <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", lineHeight: 1.1 }}>
                            {targetRoleName}
                          </div>
                        </div>
                      </div>

                      {estimatedWinRate !== null && (() => {
                        const scoreMeta = getScoreMeta(estimatedWinRate, true, language);
                        return (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                            }}
                            title={`${t.winRate}: ${estimatedWinRate.toFixed(1)}% • ${scoreMeta.label}`}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <span
                                style={{
                                  fontSize: "0.625rem",
                                  fontWeight: 900,
                                  fontFamily: "'Orbitron', monospace",
                                  padding: "0.1rem 0.3rem",
                                  borderRadius: "0.2rem",
                                  color: scoreMeta.color,
                                  background: scoreMeta.bg,
                                  border: `1px solid ${scoreMeta.border}`,
                                  lineHeight: 1,
                                }}
                              >
                                {scoreMeta.grade}
                              </span>
                              <span
                                style={{
                                  fontFamily: "'Orbitron', sans-serif",
                                  fontSize: "0.75rem",
                                  fontWeight: "bold",
                                  color: scoreMeta.color,
                                }}
                              >
                                {scoreMeta.score.toFixed(1)}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.47rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {t.scoreLabel}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {t.waitingDraftPicks}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de Explorador de Sinergia O Mensaje de Equipo Completo */}
        <div className="cyber-panel synergy-explorer-panel">
          <div className="panel-header synergy-panel-header">
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ color: isDraftComplete ? "#00ff88" : "var(--color-cyan)", fontWeight: "bold" }}>●</span>{" "}
              {isDraftComplete ? t.teamStatus : t.roleSynergyExplorer}
            </span>
            <span
              style={{
                fontSize: "0.625rem",
                color: isDraftComplete ? "#00ff88" : "var(--color-cyan)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: "bold",
              }}
            >
              {isDraftComplete
                ? t.selectionCompleted
                : selectedRoleCategory === "all"
                ? t.allAgentsSortedWinRate
                : `${roleCategoryLabels[selectedRoleCategory]} (${filteredAgents.length} ${t.available})`}
            </span>
          </div>

          {isDraftComplete ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                gap: "0.875rem",
                padding: "1.25rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "3.25rem",
                  height: "3.25rem",
                  borderRadius: "50%",
                  background: "rgba(0, 255, 136, 0.12)",
                  border: "2px solid #00ff88",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 1.25rem rgba(0, 255, 136, 0.3)",
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "1rem",
                    fontWeight: 900,
                    color: "#00ff88",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {t.draftCompleted}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: "0.25rem",
                  }}
                >
                  {t.draftCompleteSubtitle}
                </div>
              </div>

              <button
                onClick={() => setView("ingame")}
                style={{
                  marginTop: "0.375rem",
                  padding: "0.5rem 1.375rem",
                  background: "var(--color-cyan)",
                  color: "#000",
                  border: "none",
                  borderRadius: "0.25rem",
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "0.6875rem",
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  boxShadow: "0 0 0.95rem rgba(56, 189, 248, 0.35)",
                  transition: "all 0.2s ease",
                }}
              >
                {t.goToWeaponShop} →
              </button>
            </div>
          ) : (
            <div
              className="synergy-agents-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(13rem, 1fr))",
                gridAutoRows:
                  filteredAgents.length >= 24
                    ? "minmax(3rem, 1fr)"
                    : "minmax(3.2rem, 4rem)",
                gap: "0.35rem",
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                paddingRight: "0.25rem",
                marginTop: "0.35rem",
              }}
            >
              {filteredAgents.map((agent) => {
                const agentRecommendation = getAgentRecommendation(recMap, agent.uuid, agent.displayName);
                const estimatedWinRate = agentRecommendation ? agentRecommendation.winRate : null;
                const isCurrentAgentSelected = selectedAgentUuid === agent.uuid;
                const isAgentPickedByTeam = myTeam.some(
                  (p) => (p.agentId || "").toLowerCase() === agent.uuid.toLowerCase()
                );

                return (
                  <div
                    key={agent.uuid}
                    className={`synergy-agent-card ${isCurrentAgentSelected ? "selected" : ""} ${isAgentPickedByTeam ? "team-picked" : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.3rem 0.5rem",
                      background: isCurrentAgentSelected
                        ? "rgba(0, 243, 255, 0.15)"
                        : isAgentPickedByTeam
                        ? "rgba(0, 255, 136, 0.06)"
                        : "rgba(15, 25, 35, 0.75)",
                      border: isCurrentAgentSelected
                        ? "1px solid var(--color-cyan)"
                        : isAgentPickedByTeam
                        ? "1px solid rgba(0, 255, 136, 0.25)"
                        : "1px solid rgba(0, 243, 255, 0.18)",
                      borderRadius: "0.3rem",
                      cursor: isAgentPickedByTeam ? "default" : "pointer",
                      transition: "all 0.18s ease",
                      gap: "0.4rem",
                      minWidth: 0,
                      height: "100%",
                      boxSizing: "border-box",
                    }}
                    onClick={() => {
                      if (!isAgentPickedByTeam) {
                        setSelectedAgentUuid(agent.uuid);
                        selectAgent(agent.uuid);
                      }
                    }}
                  >
                    {/* Foto + Nombre + Rol */}
                    <div
                      className="synergy-agent-identity"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        minWidth: 0,
                        flex: 1,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={agent.displayIcon}
                        alt={agent.displayName}
                        className={`synergy-agent-avatar ${isCurrentAgentSelected ? "selected" : ""} ${isAgentPickedByTeam ? "picked" : ""}`}
                        style={{
                          width: "2rem",
                          height: "2rem",
                          minWidth: "2rem",
                          maxWidth: "2rem",
                          minHeight: "2rem",
                          maxHeight: "2rem",
                          borderRadius: "0.22rem",
                          objectFit: "cover",
                          flexShrink: 0,
                          display: "block",
                          border: isCurrentAgentSelected
                            ? "1px solid var(--color-cyan)"
                            : isAgentPickedByTeam
                            ? "1px solid rgba(0, 255, 136, 0.4)"
                            : "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      />
                      <div
                        className="synergy-agent-names"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 0,
                          flex: 1,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          className="synergy-agent-name"
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            color: isCurrentAgentSelected
                              ? "var(--color-cyan)"
                              : isAgentPickedByTeam
                              ? "#00ff88"
                              : "#ffffff",
                            lineHeight: 1.15,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={agent.displayName}
                        >
                          {agent.displayName}
                        </div>
                        <div
                          className="synergy-agent-role"
                          style={{
                            fontSize: "0.6rem",
                            color: "var(--text-muted)",
                            lineHeight: 1.1,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={agent.role?.displayName || "Agent"}
                        >
                          {agent.role?.displayName || "Agent"}
                        </div>
                      </div>
                    </div>

                    {/* Win Rate o Badge 'EN EQUIPO' + Botón Pick/Lock en columna compacta */}
                    <div
                      className="synergy-agent-actions"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        gap: "0.2rem",
                        flexShrink: 0,
                        minWidth: "3.2rem",
                      }}
                    >
                      {isAgentPickedByTeam ? (
                        <span
                          className="synergy-team-badge"
                          style={{
                            fontSize: "0.52rem",
                            fontWeight: 800,
                            color: "#00ff88",
                            padding: "0.08rem 0.3rem",
                            background: "rgba(0, 255, 136, 0.12)",
                            border: "1px solid rgba(0, 255, 136, 0.3)",
                            letterSpacing: "0.02em",
                            whiteSpace: "nowrap",
                            lineHeight: 1.1,
                          }}
                        >
                          EQUIPO
                        </span>
                      ) : estimatedWinRate !== null ? (() => {
                        const scoreMeta = getScoreMeta(estimatedWinRate, true, language);
                        return (
                          <div
                            className="synergy-winrate-box"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.2rem",
                              padding: "0.06rem 0.25rem",
                              background: "rgba(0, 0, 0, 0.35)",
                              borderRadius: "0.18rem",
                              border: `1px solid ${scoreMeta.border}`,
                            }}
                            title={`${t.winRate}: ${estimatedWinRate.toFixed(1)}% • ${scoreMeta.label}`}
                          >
                            <span
                              style={{
                                fontSize: "0.56rem",
                                fontWeight: 900,
                                fontFamily: "'Orbitron', monospace",
                                color: scoreMeta.color,
                                lineHeight: 1,
                              }}
                            >
                              {scoreMeta.grade}
                            </span>
                            <span
                              className="synergy-winrate-val"
                              style={{
                                fontFamily: "'Orbitron', monospace, sans-serif",
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                color: scoreMeta.color,
                                letterSpacing: "0.02em",
                                lineHeight: 1,
                              }}
                            >
                              {scoreMeta.score.toFixed(1)}
                            </span>
                          </div>
                        );
                      })() : null}

                      <button
                        type="button"
                        disabled={isAgentPickedByTeam}
                        className={`synergy-pick-btn ${isCurrentAgentSelected ? "selected" : ""}`}
                        style={{
                          padding: "0.16rem 0.4rem",
                          fontSize: "0.58rem",
                          fontFamily: "'Orbitron', sans-serif",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                          borderRadius: "0.18rem",
                          border: "none",
                          cursor: isAgentPickedByTeam ? "default" : "pointer",
                          whiteSpace: "nowrap",
                          width: "100%",
                          transition: "all 0.18s ease",
                          background: isAgentPickedByTeam
                            ? "rgba(255, 255, 255, 0.06)"
                            : isCurrentAgentSelected
                            ? "var(--color-red)"
                            : "rgba(255, 70, 85, 0.22)",
                          color: isAgentPickedByTeam ? "var(--text-muted)" : "#ffffff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1.15,
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!isAgentPickedByTeam) {
                            setSelectedAgentUuid(agent.uuid);
                            selectAgent(agent.uuid);
                            lockAgent(agent.uuid);
                          }
                        }}
                      >
                        {isAgentPickedByTeam
                          ? t.fixed
                          : isCurrentAgentSelected
                          ? t.lock
                          : t.pick}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Column 3: Grid Selection */}
      <div className="cyber-panel pregame-select-panel">
        <div className="panel-header">
          <span>{t.selectHeroAgent}</span>
        </div>

        <div
          className="tabs-header"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.15rem",
            padding: "0.35rem 0.35rem",
            width: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {["all", "duelist", "initiator", "controller", "sentinel"].map((roleCategory) => (
            <button
              key={roleCategory}
              className={`tab-btn ${selectedRoleCategory === roleCategory ? "active" : ""}`}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "0.35rem 0.12rem",
                fontSize: "clamp(0.48rem, 0.6vw, 0.55rem)",
                letterSpacing: "0.01em",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "clip",
              }}
              onClick={() => setSelectedRoleCategory(roleCategory)}
            >
              {roleCategoryLabels[roleCategory] ||
                roleCategory.charAt(0).toUpperCase() + roleCategory.slice(1)}
            </button>
          ))}
        </div>

        <div
          className="agents-grid-container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "clamp(0.45rem, 0.9vh, 0.7rem)",
            padding: "clamp(0.55rem, 1vh, 0.85rem)",
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
            alignContent: "start",
          }}
        >
          {isLoadingAgents ? (
            <div style={{ padding: "20px", textAlign: "center" }}>{t.loadingAgents}</div>
          ) : (
            filteredAgents.map((agent) => (
              <div
                key={agent.uuid}
                className={`agent-grid-item ${selectedAgentUuid === agent.uuid ? "selected" : ""}`}
                onClick={() => {
                  setSelectedAgentUuid(agent.uuid);
                  selectAgent(agent.uuid);
                }}
              >
                <img
                  src={agent.displayIcon}
                  alt={agent.displayName}
                  style={{
                    width: "100%",
                    height: "100%",
                    minWidth: "100%",
                    maxWidth: "100%",
                    minHeight: "100%",
                    maxHeight: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            ))
          )}
        </div>

        {/* Active Selection Compact Footer Bar (15%-20% height max) */}
        <div
          className="selection-panel"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.55rem",
            padding: "0.35rem 0.65rem",
            height: "clamp(2.8rem, 6vh, 3.4rem)",
            minHeight: "clamp(2.8rem, 6vh, 3.4rem)",
            maxHeight: "clamp(2.8rem, 6vh, 3.4rem)",
            borderTop: "1px solid var(--border-cyber)",
            background: "rgba(8, 14, 20, 0.95)",
            flexShrink: 0,
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          <div
            className="selection-portrait-wrap"
            style={{
              width: "clamp(2.1rem, 4.5vh, 2.5rem)",
              height: "clamp(2.1rem, 4.5vh, 2.5rem)",
              minWidth: "clamp(2.1rem, 4.5vh, 2.5rem)",
              maxWidth: "clamp(2.1rem, 4.5vh, 2.5rem)",
              minHeight: "clamp(2.1rem, 4.5vh, 2.5rem)",
              maxHeight: "clamp(2.1rem, 4.5vh, 2.5rem)",
              borderRadius: "0.25rem",
              border: "1px solid var(--border-cyber)",
              background: "rgba(0, 0, 0, 0.5)",
              overflow: "hidden",
              flexShrink: 0,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selectedAgent ? (
              <img
                src={selectedAgent.displayIcon}
                alt={selectedAgent.displayName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                  display: "block",
                }}
              />
            ) : (
              <div className="selection-portrait-placeholder">
                <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>?</span>
              </div>
            )}
          </div>

          <div
            className="selection-details"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              height: "100%",
              minWidth: 0,
              overflow: "hidden",
              gap: "0.5rem",
            }}
          >
            <div
              className="selection-info-header"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.1rem",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div
                className="selection-name"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: selectedAgent
                    ? "clamp(0.68rem, 0.9vw, 0.82rem)"
                    : "clamp(0.48rem, 0.62vw, 0.56rem)",
                  fontWeight: 900,
                  color: selectedAgent ? "var(--color-cyan)" : "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: selectedAgent ? "0.02em" : "0px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.15,
                }}
              >
                {selectedAgent ? selectedAgent.displayName : t.selectAgent}
              </div>
              <div
                className="selection-role"
                style={{
                  fontSize: "clamp(0.5rem, 0.68vw, 0.56rem)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1,
                }}
              >
                {selectedAgent ? selectedAgent.role?.displayName : t.classRole}
              </div>
            </div>

            <div
              className="selection-actions"
              style={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <button
                className="lock-btn"
                disabled={!selectedAgent}
                onClick={() => {
                  if (selectedAgent) lockAgent(selectedAgent.uuid);
                }}
                style={{
                  padding: "0 0.65rem",
                  height: "clamp(1.9rem, 4vh, 2.2rem)",
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "clamp(0.56rem, 0.72vw, 0.64rem)",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.25rem",
                  cursor: selectedAgent ? "pointer" : "not-allowed",
                }}
              >
                {t.lockAgentBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
