"use client";

import { useState } from "react";
import { useValorantData } from "@/hooks/useValorantData";
import { useGameState } from "@/hooks/useGameState";
import { useLanguage } from "@/context/LanguageContext";

export default function ViewPregame() {
  const { agents, loading: isLoadingAgents } = useValorantData();
  const {
    selectedMap,
    selectedMode,
    myTeam,
    selectAgent,
    lockAgent,
    mlRecommendations,
    mlSynergyWinRate,
    mlAgentImpacts,
    setView,
  } = useGameState();
  const { t } = useLanguage();

  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>("all");
  const [selectedAgentUuid, setSelectedAgentUuid] = useState<string | null>(null);

  const pickedPlayers = myTeam.filter((player) => player.agentId && player.agentId.trim() !== "");
  const pickedAgentsCount = pickedPlayers.length;
  const isDraftComplete = pickedAgentsCount >= 5;

  const pickedAgentsList = pickedPlayers
    .map((player) =>
      agents.find((agent) => agent.uuid.toLowerCase() === (player.agentId || "").toLowerCase())
    )
    .filter((agent): agent is NonNullable<typeof agent> => Boolean(agent));

  // Helper para buscar la recomendación de la IA para un agente dado (por UUID o por nombre normalizado)
  const getAgentRecommendation = (agentUuid: string, agentDisplayName: string) => {
    const cleanDisplayName = agentDisplayName.toLowerCase().replace(/[^a-z0-9]/g, "");
    return mlRecommendations?.find((rec) => {
      const recUuid = (rec.uuid || "").toLowerCase();
      const recAgent = (rec.agent || rec.displayName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return (
        (recUuid && recUuid === agentUuid.toLowerCase()) ||
        recAgent === cleanDisplayName
      );
    });
  };

  // Filtrar y ordenar los agentes según el porcentaje de victoria estimado por la IA
  const filteredAgents = agents
    .filter((agent) => {
      if (selectedRoleCategory === "all") return true;
      return agent.role?.displayName.toLowerCase() === selectedRoleCategory;
    })
    .sort((agentA, agentB) => {
      const recommendationA = getAgentRecommendation(agentA.uuid, agentA.displayName);
      const recommendationB = getAgentRecommendation(agentB.uuid, agentB.displayName);
      const winRateA = recommendationA ? recommendationA.winRate : 0;
      const winRateB = recommendationB ? recommendationB.winRate : 0;
      return winRateB - winRateA;
    });

  const selectedAgent = agents.find((agent) => agent.uuid === selectedAgentUuid);

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
              ? agents.find((agent) => agent.uuid.toLowerCase() === player.agentId?.toLowerCase())
              : null;

            const displayAgentName = matchedAgent ? matchedAgent.displayName : t.selecting;

            const agentImpact = player.agentId
              ? mlAgentImpacts?.find(
                  (imp) =>
                    imp.uuid?.toLowerCase() === player.agentId?.toLowerCase() ||
                    (matchedAgent && imp.agent?.toLowerCase() === matchedAgent.displayName.toLowerCase())
                )
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
            <span className="sandbox-badge">{selectedMode}</span>
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
              const synergyScorePercent = Math.min(
                100,
                Math.max(0, Math.round(mlSynergyWinRate || 50))
              );
              const strokeOffsetValue = Math.max(
                0,
                172 - (172 * synergyScorePercent) / 100
              );

              let compositionRatingText = t.averageComposition;
              let compositionThemeColor = "var(--color-cyan)";

              if (synergyScorePercent >= 70) {
                compositionRatingText = t.metaComposition;
                compositionThemeColor = "#00ff88";
              } else if (synergyScorePercent >= 55) {
                compositionRatingText = t.balancedComposition;
                compositionThemeColor = "var(--color-cyan)";
              } else if (synergyScorePercent < 45) {
                compositionRatingText = t.highRiskComposition;
                compositionThemeColor = "#ff4655";
              }

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
                      {synergyScorePercent}%
                    </div>
                  </div>

                  <div className="synergy-feedback" style={{ marginTop: "4px" }}>
                    <div
                      className="synergy-rating"
                      style={{ color: compositionThemeColor, fontSize: "11px" }}
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
                        <strong className="weak-label">{t.aiStatus}</strong>
                        <span className="synergy-analysis-text">
                          {isDraftComplete
                            ? t.fullCompAnalyzed
                            : t.evaluatingSynergies}
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
                mlRecommendations.slice(0, 5).map((recommendation: any, rankIndex: number) => {
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

                      {estimatedWinRate !== null && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Orbitron', sans-serif",
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: estimatedWinRate >= 70 ? "#00ff88" : "var(--color-cyan)",
                            }}
                          >
                            {estimatedWinRate.toFixed(1)}%
                          </span>
                          <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>
                            {t.estWinRate}
                          </span>
                        </div>
                      )}
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
        <div
          className="cyber-panel"
          style={{
            flex: 1,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div
            className="panel-header"
            style={{
              width: "100%",
              padding: "0 0 8px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(0, 243, 255, 0.15)",
              background: "transparent",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: isDraftComplete ? "#00ff88" : "var(--color-cyan)", fontWeight: "bold" }}>●</span>{" "}
              {isDraftComplete ? "ESTADO DEL EQUIPO" : t.roleSynergyExplorer}
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
                gap: "14px",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "rgba(0, 255, 136, 0.12)",
                  border: "2px solid #00ff88",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(0, 255, 136, 0.3)",
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
                    fontSize: "16px",
                    fontWeight: 900,
                    color: "#00ff88",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  EQUIPO COMPLETO (5/5)
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  Todos los agentes han sido seleccionados. La selección está cerrada.
                </div>
              </div>

              <button
                onClick={() => setView("ingame")}
                style={{
                  marginTop: "6px",
                  padding: "8px 22px",
                  background: "var(--color-cyan)",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "1px",
                  cursor: "pointer",
                  boxShadow: "0 0 15px rgba(56, 189, 248, 0.35)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(56, 189, 248, 0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 0 15px rgba(56, 189, 248, 0.35)";
                }}
              >
                IR A SELECCIÓN DE ARMAS →
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gridAutoRows: "max-content",
                alignContent: "start",
                gap: "8px",
                flex: 1,
                overflowY: "auto",
                paddingRight: "4px",
                marginTop: "8px",
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
                    onClick={() => {
                      if (!isAgentPickedByTeam) {
                        setSelectedAgentUuid(agent.uuid);
                        selectAgent(agent.uuid);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
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
                      borderRadius: "4px",
                      cursor: isAgentPickedByTeam ? "default" : "pointer",
                      transition: "all 0.2s ease",
                      opacity: isAgentPickedByTeam ? 0.85 : 1,
                    }}
                    onMouseEnter={(event) => {
                      if (!isCurrentAgentSelected && !isAgentPickedByTeam) {
                        event.currentTarget.style.borderColor = "var(--color-cyan)";
                        event.currentTarget.style.background = "rgba(0, 243, 255, 0.08)";
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!isCurrentAgentSelected && !isAgentPickedByTeam) {
                        event.currentTarget.style.borderColor = "rgba(0, 243, 255, 0.18)";
                        event.currentTarget.style.background = "rgba(15, 25, 35, 0.75)";
                      }
                    }}
                  >
                    {/* Foto + Nombre + Rol */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src={agent.displayIcon}
                        alt={agent.displayName}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "4px",
                          objectFit: "cover",
                          border: isCurrentAgentSelected
                            ? "1px solid var(--color-cyan)"
                            : isAgentPickedByTeam
                            ? "1px solid rgba(0, 255, 136, 0.4)"
                            : "1px solid transparent",
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: isCurrentAgentSelected
                              ? "var(--color-cyan)"
                              : isAgentPickedByTeam
                              ? "#00ff88"
                              : "#fff",
                          }}
                        >
                          {agent.displayName}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          {agent.role?.displayName || "Agent"}
                        </div>
                      </div>
                    </div>

                    {/* Win Rate o Badge 'EN EQUIPO' + Botón Pick/Lock */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {isAgentPickedByTeam ? (
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
                          EN EQUIPO
                        </span>
                      ) : estimatedWinRate !== null ? (
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontFamily: "'Orbitron', sans-serif",
                              fontSize: "12px",
                              fontWeight: "bold",
                              color:
                                estimatedWinRate >= 70 ? "#00ff88" : "var(--color-cyan)",
                            }}
                          >
                            {estimatedWinRate.toFixed(1)}%
                          </div>
                          <div style={{ fontSize: "8px", color: "var(--text-muted)" }}>
                            {t.estWinRate}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          --
                        </span>
                      )}

                      <button
                        disabled={isAgentPickedByTeam}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!isAgentPickedByTeam) {
                            setSelectedAgentUuid(agent.uuid);
                            selectAgent(agent.uuid);
                            lockAgent(agent.uuid);
                          }
                        }}
                        style={{
                          padding: "5px 10px",
                          fontSize: "10px",
                          fontFamily: "'Orbitron', sans-serif",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderRadius: "3px",
                          border: "none",
                          cursor: isAgentPickedByTeam ? "default" : "pointer",
                          background: isAgentPickedByTeam
                            ? "rgba(255, 255, 255, 0.08)"
                            : isCurrentAgentSelected
                            ? "var(--color-red)"
                            : "rgba(255, 70, 85, 0.2)",
                          color: isAgentPickedByTeam ? "var(--text-muted)" : "#fff",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(event) => {
                          if (!isAgentPickedByTeam) {
                            event.currentTarget.style.background = "var(--color-red)";
                            event.currentTarget.style.boxShadow =
                              "0 0 10px rgba(255, 70, 85, 0.5)";
                          }
                        }}
                        onMouseLeave={(event) => {
                          if (!isAgentPickedByTeam) {
                            event.currentTarget.style.background = isCurrentAgentSelected
                              ? "var(--color-red)"
                              : "rgba(255, 70, 85, 0.2)";
                            event.currentTarget.style.boxShadow = "none";
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
                <img src={agent.displayIcon} alt={agent.displayName} />
              </div>
            ))
          )}
        </div>

        {/* Active Selection Area */}
        <div className="selection-panel">
          <div className="selection-portrait-wrap">
            {selectedAgent ? (
              <img
                src={selectedAgent.bustPortrait || selectedAgent.fullPortrait}
                alt={selectedAgent.displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
