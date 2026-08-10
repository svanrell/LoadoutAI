"use client";

import { useState } from "react";
import { useValorantData } from "@/hooks/useValorantData";
import { useGameState } from "@/hooks/useGameState";

export default function ViewPregame() {
  const { agents, loading } = useValorantData();
  const { selectedMap, selectedMode, myTeam, selectAgent, lockAgent } = useGameState();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const filteredAgents = agents.filter((agent) => {
    if (activeTab === "all") return true;
    return agent.role?.displayName.toLowerCase() === activeTab;
  });

  const selectedAgent = agents.find((a) => a.uuid === selectedAgentId);

  return (
    <div id="viewPregame" className="state-view active">
      {/* Column 1: Team Configuration */}
      <div className="cyber-panel pregame-team-panel">
        <div className="panel-header">
          <span>My Team Composition</span>
          <span id="teamCount" className="accent">
            {myTeam.filter(p => p.agentId).length} / {myTeam.length} Picked
          </span>
        </div>
        <div className="team-list">
          {myTeam.map((player, index) => {
            const agentData = player.agentId ? agents.find(a => a.uuid.toLowerCase() === player.agentId) : null;
            const agentName = agentData ? agentData.displayName : 'Selecting...';
            
            let statusBadgeText = 'OPEN';
            let statusBadgeClass = 'status-open';

            if (player.state === 'locked') {
                statusBadgeText = 'LOCKED';
                statusBadgeClass = 'status-locked';
            } else if (player.state === 'selected') {
                statusBadgeText = 'PRE-PICK';
                statusBadgeClass = 'status-prepick';
            }

            return (
              <div key={player.puuid || index} className={`player-card ${player.state === 'locked' ? 'locked' : ''} ${player.state === 'selected' ? 'selecting' : ''}`}
                style={player.playerCardId && player.playerCardId !== 'locked' ? { backgroundImage: `linear-gradient(rgba(11, 18, 25, 0.85), rgba(11, 18, 25, 0.95)), url(https://media.valorant-api.com/playercards/${player.playerCardId}/wideart.png)`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                <div className="player-index">{index + 1}</div>
                <div className="player-avatar-wrap">
                  {agentData ? (
                    <img src={agentData.displayIcon} alt={agentData.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="7" r="4"></circle>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    </svg>
                  )}
                </div>
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-agent">{agentName}</div>
                  <div className="player-meta">
                    <span className="player-level">LVL {player.level || '--'}</span>
                    <span className={`status-badge-inner ${statusBadgeClass}`}>{statusBadgeText}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Game Mode Specifications Info Panel */}
        <div className="sandbox-controls-card">
          <div className="sandbox-header">
            <span>Mode Specifications</span>
            <span className="sandbox-badge">{selectedMode}</span>
          </div>

          <div className="sandbox-fields">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                <span style={{ color: "var(--text-muted)" }}>Team Capacity:</span>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: "bold", color: "var(--color-cyan)" }}>
                  5 Players
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                <span style={{ color: "var(--text-muted)" }}>Economy Rules:</span>
                <span className="rules-badge-buy enabled">Buy Allowed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Dashboard */}
      <div className="dashboard-col">
        <div className="ai-rec-grid">
          <div className="cyber-panel synergy-card">
            <div className="panel-header" style={{ width: "100%", borderBottom: "none", background: "transparent", padding: "0 0 15px 0" }}>
              <span>Team Synergy Analyzer</span>
            </div>

            <div className="synergy-gauge-container">
              <svg width="140" height="80" viewBox="0 0 140 80">
                <path className="synergy-ring-bg" d="M 15,75 A 55,55 0 0,1 125,75" />
                <path className="synergy-ring-fill" d="M 15,75 A 55,55 0 0,1 125,75" style={{ strokeDashoffset: 172 }} />
              </svg>
              <div className="synergy-value">0%</div>
            </div>

            <div className="synergy-feedback">
              <div className="synergy-rating">CRITICAL COMPOSITION</div>
              <div className="synergy-analysis-box">
                <div className="synergy-analysis-item">
                  <strong className="strong-label">Strengths</strong>
                  <span className="synergy-analysis-text">None</span>
                </div>
                <div className="synergy-analysis-item">
                  <strong className="weak-label">Weakness</strong>
                  <span className="synergy-analysis-text">Missing key roles.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: Grid Selection */}
      <div className="cyber-panel pregame-select-panel">
        <div className="panel-header">
          <span>Select Hero Agent</span>
        </div>

        <div className="tabs-header">
          {["all", "duelist", "initiator", "controller", "sentinel"].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="agents-grid-container">
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>Loading agents...</div>
          ) : (
            filteredAgents.map((agent) => (
              <div
                key={agent.uuid}
                className={`agent-grid-item ${selectedAgentId === agent.uuid ? "selected" : ""}`}
                onClick={() => {
                  setSelectedAgentId(agent.uuid);
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
              <img src={selectedAgent.bustPortrait || selectedAgent.fullPortrait} alt={selectedAgent.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div className="selection-portrait-placeholder">
                <span>No Character<br />Selected</span>
              </div>
            )}
          </div>

          <div className="selection-details">
            <div className="selection-info-header">
              <div className="selection-name">{selectedAgent ? selectedAgent.displayName : "Select Agent"}</div>
              <div className="selection-role">{selectedAgent ? selectedAgent.role?.displayName : "Class Role"}</div>
            </div>
            <div className="selection-actions">
              <button 
                className="lock-btn" 
                disabled={!selectedAgent}
                onClick={() => { if (selectedAgent) lockAgent(selectedAgent.uuid); }}
              >
                Lock Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
