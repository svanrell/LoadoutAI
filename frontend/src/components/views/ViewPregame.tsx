"use client";

import { useState, useMemo } from "react";
import { useValorantData } from "@/hooks/useValorantData";
import { useGameState, MLDraftRecommendation } from "@/hooks/useGameState";
import { useLanguage } from "@/context/LanguageContext";
import { getScoreMeta } from "@/lib/scoreUtils";
import { getGameModeName } from "@/data/gameModesData";

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
  const agentByUuidMap = useMemo(() => {
    const map = new Map<string, (typeof agents)[0]>();
    for (const agent of agents) {
      map.set(agent.uuid.toLowerCase(), agent);
    }
    return map;
  }, [agents]);

  // useMemo (Mapa 2): Indexa las recomendaciones de la IA por UUID y nombre para evitar búsquedas lentas
  const recMap = useMemo(() => {
    const map = new Map<string, any>();
    if (!mlRecommendations) return map;
    for (const rec of mlRecommendations) {
      if (rec.uuid) map.set(rec.uuid.toLowerCase(), rec);
      const nameKey = (rec.agent || rec.displayName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (nameKey) map.set(nameKey, rec);
    }
    return map;
  }, [mlRecommendations]);

  // useMemo (Mapa 3): Indexa los impactos individuales (deltas ▲/▼) de cada agente
  const impactMap = useMemo(() => {
    const map = new Map<string, any>();
    if (!mlAgentImpacts) return map;
    for (const imp of mlAgentImpacts) {
      if (imp.uuid) map.set(imp.uuid.toLowerCase(), imp);
      const nameKey = (imp.agent || imp.displayName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (nameKey) map.set(nameKey, imp);
    }
    return map;
  }, [mlAgentImpacts]);

  // Jugadores del equipo que ya han elegido un personaje
  const pickedPlayers = myTeam.filter((player) => player.agentId && player.agentId.trim() !== "");
  const pickedAgentsCount = pickedPlayers.length;
  // Cuando hay 5 agentes seleccionados, el draft se da por completado
  const isDraftComplete = pickedAgentsCount >= 5;

  // useMemo: Lista de agentes ya elegidos por el equipo para el resumen final
  const pickedAgentsList = useMemo(() => {
    return pickedPlayers
      .map((player) => agentByUuidMap.get((player.agentId || "").toLowerCase()))
      .filter((agent): agent is NonNullable<typeof agent> => Boolean(agent));
  }, [pickedPlayers, agentByUuidMap]);

  // Helper O(1) para buscar la recomendación de la IA para un agente dado
  const getAgentRecommendation = (agentUuid: string, agentDisplayName: string) => {
    return (
      recMap.get(agentUuid.toLowerCase()) ||
      recMap.get(agentDisplayName.toLowerCase().replace(/[^a-z0-9]/g, "")) ||
      null
    );
  };

  // Filtrar y ordenar los agentes de forma memoizada en O(1) por comparación
  const filteredAgents = useMemo(() => {
    return agents
      .filter((agent) => {
        if (selectedRoleCategory === "all") return true;
        return agent.role?.displayName.toLowerCase() === selectedRoleCategory;
      })
      .sort((agentA, agentB) => {
        const recommendationA =
          recMap.get(agentA.uuid.toLowerCase()) ||
          recMap.get(agentA.displayName.toLowerCase().replace(/[^a-z0-9]/g, ""));
        const recommendationB =
          recMap.get(agentB.uuid.toLowerCase()) ||
          recMap.get(agentB.displayName.toLowerCase().replace(/[^a-z0-9]/g, ""));
        const winRateA = recommendationA ? recommendationA.winRate : 0;
        const winRateB = recommendationB ? recommendationB.winRate : 0;
        return winRateB - winRateA;
      });
  }, [agents, selectedRoleCategory, recMap]);

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
      <div className="cyber-panel pregame-team-panel">
        <div className="panel-header">
          <span>{t.myTeamComposition}</span>
          <span id="teamCount" className="accent">
            {pickedAgentsCount} / {myTeam.length} {t.picked}
          </span>
        </div>

        <div className="team-list">
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
                style={
                  player.playerCardId && player.playerCardId !== "locked"
                    ? {
                        backgroundImage: `linear-gradient(rgba(11, 18, 25, 0.85), rgba(11, 18, 25, 0.95)), url(https://media.valorant-api.com/playercards/${player.playerCardId}/wideart.png)`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
              >
                <div className="player-index">{playerIndex + 1}</div>

                <div className="player-avatar-wrap">
                  {matchedAgent ? (
                    <img
                      src={matchedAgent.displayIcon}
                      alt={matchedAgent.displayName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="7" r="4"></circle>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    </svg>
                  )}
                </div>

                <div className="player-info">
                  <div className="player-name">{displayPlayerName}</div>
                  <div className="player-agent">{displayAgentName}</div>
                  <div className="player-meta" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                    <span className="player-level">
                      {t.lvl} {player.level || "--"}
                    </span>
                    <span className={`status-badge-inner ${playerStatusCssClass}`}>
                      {playerStatusLabel}
                    </span>
                    {agentImpact && typeof agentImpact.impactDelta === "number" && (
                      <span
                        title={`Aporte a la sinergia del equipo: ${agentImpact.impactDelta > 0 ? "+" : ""}${agentImpact.impactDelta.toFixed(1)}%`}
                        style={{
                          fontSize: "9px",
                          fontFamily: "'Orbitron', sans-serif",
                          fontWeight: 800,
                          padding: "1px 5px",
                          borderRadius: "3px",
                          letterSpacing: "0.5px",
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

        {/* Game Mode Specifications Info Panel */}
        <div className="sandbox-controls-card">
          <div className="sandbox-header">
            <span>{t.modeSpecs}</span>
            <span className="sandbox-badge">{getGameModeName(selectedMode, language).toUpperCase()}</span>
          </div>

          <div className="sandbox-fields">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "11px",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>{t.teamCapacity}</span>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: "bold",
                    color: "var(--color-cyan)",
                  }}
                >
                  5 {t.playersCount}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "11px",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>{t.economyRules}</span>
                <span className="rules-badge-buy enabled">{t.buyAllowed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Dashboard */}
      <div className="dashboard-col" style={{ display: "flex", flexDirection: "column", height: "100%", gap: "12px" }}>
        <div className="ai-rec-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "stretch" }}>
          {/* Team Synergy Gauge */}
          <div className="cyber-panel synergy-card" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div
              className="panel-header"
              style={{
                width: "100%",
                borderBottom: "none",
                background: "transparent",
                padding: "0 0 3px 0",
              }}
            >
              <span>{t.teamSynergyAnalyzer}</span>
              <span className="accent" style={{ fontSize: "11px" }}>
                {selectedMap.toUpperCase()}
              </span>
            </div>

            {(() => {
              const rawWinRate = mlSynergyWinRate || 50;
              const scoreMeta = getScoreMeta(rawWinRate, true, language);
              const synergyScorePercent = Math.min(100, Math.max(0, Math.round(rawWinRate)));
              const strokeOffsetValue = Math.max(
                0,
                172 - (172 * (scoreMeta.score * 10)) / 100
              );

              const compositionRatingText = `${scoreMeta.grade} • ${scoreMeta.label.toUpperCase()}`;
              const compositionThemeColor = scoreMeta.color;

              return (
                <>
                  <div className="synergy-gauge-container" style={{ margin: "4px 0" }}>
                    <svg width="140" height="75" viewBox="0 0 140 75">
                      <path className="synergy-ring-bg" d="M 15,70 A 55,55 0 0,1 125,70" />
                      <path
                        className="synergy-ring-fill"
                        d="M 15,70 A 55,55 0 0,1 125,70"
                        style={{
                          strokeDashoffset: strokeOffsetValue,
                          stroke: compositionThemeColor,
                        }}
                      />
                    </svg>
                    <div
                      className="synergy-value"
                      style={{ color: compositionThemeColor }}
                    >
                      {scoreMeta.score.toFixed(1)}
                    </div>
                  </div>

                  <div className="synergy-feedback" style={{ marginTop: "4px" }}>
                    <div
                      className="synergy-rating"
                      style={{ color: compositionThemeColor, fontSize: "11px", fontWeight: 800 }}
                    >
                      {compositionRatingText}
                    </div>
                    <div className="synergy-analysis-box" style={{ marginTop: "4px" }}>
                      <div className="synergy-analysis-item">
                        <strong className="strong-label">{t.picksLocked}</strong>
                        <span className="synergy-analysis-text">
                          {pickedAgentsCount} {t.of5Agents}
                        </span>
                      </div>
                      <div className="synergy-analysis-item">
                        <strong className="weak-label">WIN RATE EST.</strong>
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
          <div className="cyber-panel" style={{ padding: "12px 14px", display: "flex", flexDirection: "column" }}>
            <div
              className="panel-header"
              style={{
                width: "100%",
                padding: "0 0 6px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "none",
                background: "transparent",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#00ff88", fontWeight: "bold" }}>●</span>{" "}
                {isDraftComplete ? t.draftCompleted : t.aiDraftCoach}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  color: isDraftComplete ? "#00ff88" : "var(--color-cyan)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: "bold",
                }}
              >
                {isDraftComplete ? "DRAFT FINALIZADO" : t.top5PicksGlobal}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "4px" }}>
              {isDraftComplete ? (
                /* Locked 5 Agents Summary */
                pickedAgentsList.map((agent, rankIndex) => (
                  <div
                    key={agent.uuid || rankIndex}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 10px",
                      background: "rgba(15, 25, 35, 0.75)",
                      border: "1px solid rgba(0, 255, 136, 0.25)",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: "10px",
                          fontWeight: "bold",
                          color: "#00ff88",
                          width: "16px",
                        }}
                      >
                        #{rankIndex + 1}
                      </span>
                      <img
                        src={agent.displayIcon}
                        alt={agent.displayName}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "3px",
                          objectFit: "cover",
                        }}
                      />
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "bold", color: "#fff", lineHeight: 1.2 }}>
                          {agent.displayName}
                        </div>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)", lineHeight: 1.1 }}>
                          {agent.role?.displayName || "Agent"}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        color: "#00ff88",
                        padding: "2px 6px",
                        background: "rgba(0, 255, 136, 0.12)",
                        borderRadius: "3px",
                        border: "1px solid rgba(0, 255, 136, 0.3)",
                        letterSpacing: "0.5px",
                      }}
                    >
                      FIJADO
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
                        padding: "6px 10px",
                        background: "rgba(15, 25, 35, 0.75)",
                        border: "1px solid rgba(0, 243, 255, 0.18)",
                        borderRadius: "4px",
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
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: "10px",
                            fontWeight: "bold",
                            color: rankIndex === 0 ? "#ffd700" : "var(--text-muted)",
                            width: "16px",
                          }}
                        >
                          #{rankIndex + 1}
                        </span>

                        {targetAgent?.displayIcon ? (
                          <img
                            src={targetAgent.displayIcon}
                            alt={targetAgentName}
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "3px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              background: "#1b2733",
                              borderRadius: "3px",
                            }}
                          />
                        )}

                        <div>
                          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#fff", lineHeight: 1.2 }}>
                            {targetAgentName}
                          </div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)", lineHeight: 1.1 }}>
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
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 900,
                                  fontFamily: "'Orbitron', monospace",
                                  padding: "1px 4px",
                                  borderRadius: "2px",
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
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  color: scoreMeta.color,
                                }}
                              >
                                {scoreMeta.score.toFixed(1)}
                              </span>
                            </div>
                            <span style={{ fontSize: "7px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "11px",
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
              {isDraftComplete ? "ESTADO DEL EQUIPO" : t.roleSynergyExplorer}
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
                ? "SELECCIÓN FINALIZADA"
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
                  EQUIPO COMPLETO (5/5)
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: "0.25rem",
                  }}
                >
                  Todos los agentes han sido seleccionados. La selección está cerrada.
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
                IR A SELECCIÓN DE ARMAS →
              </button>
            </div>
          ) : (
            <div
              className="synergy-agents-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(13.75rem, 1fr))",
                gridAutoRows: "max-content",
                alignContent: "start",
                gap: "0.5rem",
                flex: 1,
                overflowY: "auto",
                paddingRight: "0.25rem",
                marginTop: "0.5rem",
              }}
            >
              {filteredAgents.map((agent) => {
                const agentRecommendation = getAgentRecommendation(agent.uuid, agent.displayName);
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
                      padding: "0.4rem 0.55rem",
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
                      transition: "all 0.2s ease",
                      gap: "0.5rem",
                      minWidth: 0,
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
                        gap: "0.45rem",
                        minWidth: 0,
                        flex: 1,
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
                          borderRadius: "0.25rem",
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
                        }}
                      >
                        <div
                          className="synergy-agent-name"
                          style={{
                            fontSize: "0.775rem",
                            fontWeight: 700,
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
                        >
                          {agent.displayName}
                        </div>
                        <div
                          className="synergy-agent-role"
                          style={{
                            fontSize: "0.625rem",
                            color: "var(--text-muted)",
                            lineHeight: 1.05,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {agent.role?.displayName || "Agent"}
                        </div>
                      </div>
                    </div>

                    {/* Win Rate o Badge 'EN EQUIPO' + Botón Pick/Lock */}
                    <div
                      className="synergy-agent-actions"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        flexShrink: 0,
                      }}
                    >
                      {isAgentPickedByTeam ? (
                        <span
                          className="synergy-team-badge"
                          style={{
                            fontSize: "0.55rem",
                            fontWeight: 800,
                            color: "#00ff88",
                            padding: "0.15rem 0.4rem",
                            background: "rgba(0, 255, 136, 0.12)",
                            borderRadius: "0.2rem",
                            border: "1px solid rgba(0, 255, 136, 0.3)",
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          EN EQUIPO
                        </span>
                      ) : estimatedWinRate !== null ? (() => {
                        const scoreMeta = getScoreMeta(estimatedWinRate, true, language);
                        return (
                          <div
                            className="synergy-winrate-box"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              flexShrink: 0,
                            }}
                            title={`${t.winRate}: ${estimatedWinRate.toFixed(1)}% • ${scoreMeta.label}`}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <span
                                style={{
                                  fontSize: "0.55rem",
                                  fontWeight: 900,
                                  fontFamily: "'Orbitron', monospace",
                                  padding: "0.05rem 0.25rem",
                                  borderRadius: "0.15rem",
                                  color: scoreMeta.color,
                                  background: scoreMeta.bg,
                                  border: `1px solid ${scoreMeta.border}`,
                                  lineHeight: 1,
                                }}
                              >
                                {scoreMeta.grade}
                              </span>
                              <div
                                className="synergy-winrate-val"
                                style={{
                                  fontFamily: "'Orbitron', monospace, sans-serif",
                                  fontSize: "0.725rem",
                                  fontWeight: 800,
                                  color: scoreMeta.color,
                                  letterSpacing: "0.02em",
                                  lineHeight: 1.1,
                                }}
                              >
                                {scoreMeta.score.toFixed(1)}
                              </div>
                            </div>
                            <div
                              className="synergy-winrate-label"
                              style={{
                                fontSize: "0.5rem",
                                color: "var(--text-muted)",
                                lineHeight: 1,
                                textTransform: "uppercase",
                                letterSpacing: "0.03em",
                              }}
                            >
                              {t.scoreLabel}
                            </div>
                          </div>
                        );
                      })() : (
                        <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                          --
                        </span>
                      )}

                      <button
                        type="button"
                        disabled={isAgentPickedByTeam}
                        className={`synergy-pick-btn ${isCurrentAgentSelected ? "selected" : ""}`}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.625rem",
                          fontFamily: "'Orbitron', sans-serif",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          borderRadius: "0.2rem",
                          border: "none",
                          cursor: isAgentPickedByTeam ? "default" : "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          transition: "all 0.18s ease",
                          background: isAgentPickedByTeam
                            ? "rgba(255, 255, 255, 0.08)"
                            : isCurrentAgentSelected
                            ? "var(--color-red)"
                            : "rgba(255, 70, 85, 0.22)",
                          color: isAgentPickedByTeam ? "var(--text-muted)" : "#ffffff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
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
                          ? "FIJADO"
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

        <div className="tabs-header">
          {["all", "duelist", "initiator", "controller", "sentinel"].map((roleCategory) => (
            <button
              key={roleCategory}
              className={`tab-btn ${selectedRoleCategory === roleCategory ? "active" : ""}`}
              onClick={() => setSelectedRoleCategory(roleCategory)}
            >
              {roleCategoryLabels[roleCategory] ||
                roleCategory.charAt(0).toUpperCase() + roleCategory.slice(1)}
            </button>
          ))}
        </div>

        <div className="agents-grid-container">
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

        {/* Active Selection Area */}
        <div className="selection-panel">
          <div className="selection-portrait-wrap" style={{ width: "4rem", height: "4rem", minWidth: "4rem", maxWidth: "4rem", minHeight: "4rem", maxHeight: "4rem", overflow: "hidden", flexShrink: 0, position: "relative" }}>
            {selectedAgent ? (
              <img
                src={selectedAgent.displayIcon}
                alt={selectedAgent.displayName}
                style={{
                  width: "100%",
                  height: "100%",
                  minWidth: "100%",
                  maxWidth: "100%",
                  minHeight: "100%",
                  maxHeight: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                  display: "block",
                }}
              />
            ) : (
              <div className="selection-portrait-placeholder">
                <span style={{ whiteSpace: "pre-line" }}>{t.noCharacterSelected}</span>
              </div>
            )}
          </div>

          <div className="selection-details">
            <div className="selection-info-header">
              <div className="selection-name">
                {selectedAgent ? selectedAgent.displayName : t.selectAgent}
              </div>
              <div className="selection-role">
                {selectedAgent ? selectedAgent.role?.displayName : t.classRole}
              </div>
            </div>
            <div className="selection-actions">
              <button
                className="lock-btn"
                disabled={!selectedAgent}
                onClick={() => {
                  if (selectedAgent) lockAgent(selectedAgent.uuid);
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
