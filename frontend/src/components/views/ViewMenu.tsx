"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useValorantData } from "@/hooks/useValorantData";
import { useLanguage } from "@/context/LanguageContext";
import {
  RoleDuelistIcon,
  RoleInitiatorIcon,
  RoleControllerIcon,
  RoleSentinelIcon,
  RefreshIcon,
  LockIcon,
} from "@/components/Icons";

export default function ViewMenu() {
  const { setView, connectionStatus } = useGameState();
  const { agents, weapons } = useValorantData();
  const { t } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState<"history" | "account" | "agents">("history");
  const [selectedModeFilter, setSelectedModeFilter] = useState("solo");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [playerName, setPlayerName] = useState("shumi747");
  const [playerTag, setPlayerTag] = useState("2721");
  const [region, setRegion] = useState("euw");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const getAgentIcon = (name: string, fallbackUuid: string) => {
    const found = agents.find((a) => a.displayName.toLowerCase() === name.toLowerCase());
    return (
      found?.displayIcon ||
      found?.bustPortrait ||
      `https://media.valorant-api.com/agents/${fallbackUuid}/displayicon.png`
    );
  };

  const getWeaponIcon = (name: string, fallbackUuid: string) => {
    const found = weapons.find((w) => w.displayName.toLowerCase() === name.toLowerCase());
    return (
      found?.displayIcon ||
      `https://media.valorant-api.com/weapons/${fallbackUuid}/displayicon.png`
    );
  };

  const userAvatar = getAgentIcon("Jett", "add6443c-41c1-48b0-a04a-a71c8b3269a9");
  const omenIcon = getAgentIcon("Omen", "8e253930-4c05-31dd-1b6c-968525494517");
  const sovaIcon = getAgentIcon("Sova", "ded3520f-4264-bfed-162d-b080e2abccf9");
  const reynaIcon = getAgentIcon("Reyna", "a3bfb85b-4241-547b-60da-05ac5ff4ba32");
  const cloveIcon = getAgentIcon("Clove", "117ed9e3-49f3-6512-3ccf-0cada7e3823b");
  const fadeIcon = getAgentIcon("Fade", "dade69b4-4f5a-8528-247b-219e5a1facd6");
  const cypherIcon = getAgentIcon("Cypher", "117ed9e3-49f3-6512-3ccf-0cada7e3823b");
  const killjoyIcon = getAgentIcon("Killjoy", "1e58de9c-4950-523e-f32c-5716974fd84b");

  const vandalIcon = getWeaponIcon("Vandal", "9c82e1bc-447a-4c3b-9c49-6e64943a8042");
  const phantomIcon = getWeaponIcon("Phantom", "ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a");
  const sheriffIcon = getWeaponIcon("Sheriff", "e336316f-4414-0ce9-7570-58be16353066");
  const ghostIcon = getWeaponIcon("Ghost", "1baa85b4-4c70-1284-64bb-6481dfc3bb4e");
  const odinIcon = getWeaponIcon("Odin", "63e6c2b6-4a88-4aa8-9a13-fd812d4c73ea");
  const bulldogIcon = getWeaponIcon("Bulldog", "ae3de142-4ee9-57ba-813d-90a37e5e4942");
  const classicIcon = getWeaponIcon("Classic", "29a0acb5-43dc-77d8-69b6-79ba608020f5");

  const matchesData = [
    {
      id: "m1",
      outcome: t.defeat,
      isWin: false,
      mode: t.soloRanked,
      duration: "28:59",
      date: "9 Ago 2026",
      agentName: "Jett",
      agentIcon: userAvatar,
      rivalName: "Reyna",
      rivalIcon: reynaIcon,
      weapons: [vandalIcon, sheriffIcon],
      kda: "8/7/3",
      csm: "6.1",
      gpm: "430",
      aiScore: "0.3",
      aiScoreLow: true,
    },
    {
      id: "m2",
      outcome: t.victory,
      isWin: true,
      mode: t.soloRanked,
      duration: "26:57",
      date: "9 Ago 2026",
      agentName: "Omen",
      agentIcon: omenIcon,
      rivalName: "Clove",
      rivalIcon: cloveIcon,
      weapons: [phantomIcon, ghostIcon],
      kda: "13/2/5",
      csm: "7.6",
      gpm: "541",
      aiScore: "3.9",
      aiScoreLow: false,
    },
    {
      id: "m3",
      outcome: t.defeat,
      isWin: false,
      mode: t.soloRanked,
      duration: "29:24",
      date: "9 Ago 2026",
      agentName: "Sova",
      agentIcon: sovaIcon,
      rivalName: "Fade",
      rivalIcon: fadeIcon,
      weapons: [odinIcon, classicIcon],
      kda: "5/9/7",
      csm: "1.4",
      gpm: "322",
      aiScore: "0.2",
      aiScoreLow: true,
    },
    {
      id: "m4",
      outcome: t.defeat,
      isWin: false,
      mode: t.soloRanked,
      duration: "31:15",
      date: "8 Ago 2026",
      agentName: "Cypher",
      agentIcon: cypherIcon,
      rivalName: "Killjoy",
      rivalIcon: killjoyIcon,
      weapons: [bulldogIcon, ghostIcon],
      kda: "6/10/8",
      csm: "4.6",
      gpm: "295",
      aiScore: "1.2",
      aiScoreLow: true,
    },
  ];

  return (
    <div id="viewMenu" className="state-view active">
      {/* 1. Sub-navigation tabs (iTero style) */}
      <div className="sub-nav-bar">
        <button
          className={`sub-nav-item ${activeSubTab === "history" ? "active" : ""}`}
          onClick={() => setActiveSubTab("history")}
        >
          {t.matchHistory}
        </button>
        <button
          className={`sub-nav-item ${activeSubTab === "account" ? "active" : ""}`}
          onClick={() => setActiveSubTab("account")}
        >
          {t.accountStats}
        </button>
        <button
          className={`sub-nav-item ${activeSubTab === "agents" ? "active" : ""}`}
          onClick={() => setActiveSubTab("agents")}
        >
          {t.agentStats}
        </button>
      </div>

      {/* 2. Search & Player Banner */}
      <div className="search-filter-section">
        <div className="search-fields-group">
          <div className="field-label-group">
            <span className="field-label-text">{t.region}</span>
            <select
              className="cyber-input"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={{ minWidth: "150px" }}
            >
              <option value="euw">Europe West (EU)</option>
              <option value="na">North America (NA)</option>
              <option value="latam">Latin America (LATAM)</option>
              <option value="br">Brazil (BR)</option>
              <option value="ap">Asia-Pacific (AP)</option>
              <option value="kr">Korea (KR)</option>
            </select>
          </div>

          <div className="field-label-group">
            <span className="field-label-text">{t.playerName}</span>
            <input
              type="text"
              className="cyber-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{ width: "130px" }}
            />
          </div>

          <div className="field-label-group">
            <span className="field-label-text">{t.tag}</span>
            <input
              type="text"
              className="cyber-input"
              value={playerTag}
              onChange={(e) => setPlayerTag(e.target.value)}
              style={{ width: "65px" }}
            />
          </div>

          <button
            className="cyber-btn-secondary"
            onClick={() => {
              setPlayerName("shumi747");
              setPlayerTag("2721");
            }}
          >
            {t.reset}
          </button>

          <button className="cyber-btn-primary" onClick={handleRefresh}>
            {t.search}
          </button>
        </div>

        {/* Active Player Chip */}
        <div className="active-player-chip">
          <img
            src={userAvatar}
            alt="Player"
            className="player-chip-avatar"
          />
          <div>
            <div className="player-chip-name">{playerName}</div>
            <div className="player-chip-rank">{t.currentRank}</div>
          </div>
        </div>
      </div>

      {/* 3. Filter Chips Bar */}
      <div className="filter-chips-bar">
        <div className="mode-chips-group">
          <button
            className={`filter-chip ${selectedModeFilter === "solo" ? "active" : ""}`}
            onClick={() => setSelectedModeFilter("solo")}
          >
            {t.soloRanked}
          </button>
          <button
            className={`filter-chip ${selectedModeFilter === "flex" ? "active" : ""}`}
            onClick={() => setSelectedModeFilter("flex")}
          >
            {t.flexRanked}
          </button>
          <button
            className={`filter-chip ${selectedModeFilter === "unrated" ? "active" : ""}`}
            onClick={() => setSelectedModeFilter("unrated")}
          >
            {t.unrated}
          </button>
        </div>

        <div className="role-chips-group">
          <button
            className={`role-chip-btn ${selectedRoleFilter === "all" ? "active" : ""}`}
            onClick={() => setSelectedRoleFilter("all")}
            title={t.allRoles}
          >
            *
          </button>
          <button
            className={`role-chip-btn ${selectedRoleFilter === "duelist" ? "active" : ""}`}
            onClick={() => setSelectedRoleFilter("duelist")}
            title={t.duelists}
          >
            <RoleDuelistIcon size={13} />
          </button>
          <button
            className={`role-chip-btn ${selectedRoleFilter === "initiator" ? "active" : ""}`}
            onClick={() => setSelectedRoleFilter("initiator")}
            title={t.initiators}
          >
            <RoleInitiatorIcon size={13} />
          </button>
          <button
            className={`role-chip-btn ${selectedRoleFilter === "controller" ? "active" : ""}`}
            onClick={() => setSelectedRoleFilter("controller")}
            title={t.controllers}
          >
            <RoleControllerIcon size={13} />
          </button>
          <button
            className={`role-chip-btn ${selectedRoleFilter === "sentinel" ? "active" : ""}`}
            onClick={() => setSelectedRoleFilter("sentinel")}
            title={t.sentinels}
          >
            <RoleSentinelIcon size={13} />
          </button>

          <select className="cyber-input" style={{ fontSize: "11px", padding: "5px 8px" }}>
            <option>{t.filterAgents}</option>
            <option>Jett</option>
            <option>Omen</option>
            <option>Reyna</option>
            <option>Sova</option>
            <option>Cypher</option>
          </select>

          <button
            className="cyber-btn-secondary"
            onClick={handleRefresh}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span style={{ display: "flex", transform: isRefreshing ? "rotate(360deg)" : "none", transition: "transform 0.5s ease" }}>
              <RefreshIcon size={12} />
            </span>
            <span>{t.refresh}</span>
          </button>
        </div>
      </div>

      {/* 4. Hero Stats Section (iTero 3-Column Layout) */}
      <div className="dashboard-hero-grid">
        {/* Card 1: Winrate & Match Count */}
        <div className="hero-stats-card">
          <div className="stats-card-header">
            <span className="stats-card-title">{t.performanceSummary}</span>
          </div>

          <div className="winrate-numbers-row">
            <div>
              <div className="stat-big-number">68</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>{t.matchesCount}</div>
            </div>
            <div>
              <div className="stat-big-percent">60.3%</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>
                {t.winRate}
              </div>
            </div>
          </div>

          {/* Last 10 Matches streak bar */}
          <div className="streak-bar-wrap">
            <div className="streak-bar-label">
              <span>{t.last10Matches}</span>
              <span style={{ color: "var(--color-cyan)" }}>5W 5L</span>
            </div>
            <div className="streak-pills-row">
              <div className="streak-pill loss" />
              <div className="streak-pill win" />
              <div className="streak-pill loss" />
              <div className="streak-pill loss" />
              <div className="streak-pill win" />
              <div className="streak-pill win" />
              <div className="streak-pill loss" />
              <div className="streak-pill win" />
              <div className="streak-pill win" />
              <div className="streak-pill loss" />
            </div>
          </div>

          {/* Top 3 Agents */}
          <div className="agent-mini-performance-row">
            <div className="agent-mini-item">
              <img
                src={userAvatar}
                alt="Jett"
                className="agent-mini-img"
              />
              <div className="agent-mini-text">
                <div style={{ color: "var(--color-red)" }}>0W 1L</div>
                <div>0%</div>
              </div>
            </div>
            <div className="agent-mini-item">
              <img
                src={omenIcon}
                alt="Omen"
                className="agent-mini-img"
              />
              <div className="agent-mini-text">
                <div style={{ color: "var(--color-cyan)" }}>1W 0L</div>
                <div>100%</div>
              </div>
            </div>
            <div className="agent-mini-item">
              <img
                src={sovaIcon}
                alt="Sova"
                className="agent-mini-img"
              />
              <div className="agent-mini-text">
                <div style={{ color: "var(--color-red)" }}>0W 1L</div>
                <div>0%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: LP / RR Rating Curve */}
        <div className="hero-stats-card">
          <div className="stats-card-header">
            <span className="stats-card-title">{t.rrGraphTitle}</span>
            <span style={{ fontSize: "11px", color: "var(--color-cyan)", fontWeight: 700 }}>
              {t.currentRank}
            </span>
          </div>

          <div className="lp-chart-container">
            <svg className="lp-chart-svg" viewBox="0 0 500 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lpCurveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(0, 240, 255, 0.3)" />
                  <stop offset="100%" stopColor="rgba(0, 240, 255, 0.0)" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

              {/* Tier labels on left Y axis */}
              <text x="5" y="24" fill="#00f0ff" fontSize="9" fontWeight="bold">PLAT</text>
              <text x="5" y="54" fill="#ffd000" fontSize="9" fontWeight="bold">GOLD</text>
              <text x="5" y="84" fill="#c0c0c0" fontSize="9" fontWeight="bold">SILV</text>
              <text x="5" y="114" fill="#cd7f32" fontSize="9" fontWeight="bold">BRON</text>

              {/* Filled Area below curve */}
              <path
                d="M 50 100 Q 120 110 180 80 T 300 50 T 400 45 T 480 40 L 480 120 L 50 120 Z"
                fill="url(#lpCurveGradient)"
              />

              {/* LP Bezier Curve Line */}
              <path
                d="M 50 100 Q 120 110 180 80 T 300 50 T 400 45 T 480 40"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="2.5"
                filter="drop-shadow(0 0 6px rgba(0, 240, 255, 0.6))"
              />

              {/* Points on Curve */}
              <circle cx="50" cy="100" r="3.5" fill="#cd7f32" stroke="#fff" strokeWidth="1" />
              <circle cx="180" cy="80" r="3.5" fill="#c0c0c0" stroke="#fff" strokeWidth="1" />
              <circle cx="300" cy="50" r="3.5" fill="#ffd000" stroke="#fff" strokeWidth="1" />
              <circle cx="400" cy="45" r="3.5" fill="#ffd000" stroke="#fff" strokeWidth="1" />
              <circle cx="480" cy="40" r="4.5" fill="#00f0ff" stroke="#fff" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Card 3: Radar Launcher & Tactical Standby Widget */}
        <div className="hero-stats-card">
          <div className="stats-card-header">
            <span className="stats-card-title">{t.liveRadarTitle}</span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color:
                  connectionStatus === "live"
                    ? "var(--color-green)"
                    : connectionStatus === "menu-mode"
                    ? "var(--color-yellow)"
                    : "var(--color-cyan)",
              }}
            >
              {connectionStatus === "live" ? t.radarOnline.toUpperCase() : t.radarStandby.toUpperCase()}
            </span>
          </div>

          <div className="radar-orb-widget">
            <div className="radar-sweep-orb">
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-cyan)" }} />
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.3 }}>
              {connectionStatus === "offline" ? t.clientOfflineText : t.clientDetectedText}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button className="dashboard-action-btn-cyan" onClick={() => setView("pregame")}>
              <span>{t.openSandbox}</span>
            </button>
            <button className="dashboard-action-btn-red" onClick={() => setView("ingame")}>
              <span>{t.launchOverlay}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Match History List (Clean Esports Cards) */}
      <div className="match-history-section">
        {matchesData.map((match) => (
          <div key={match.id} className={`match-row-card ${match.isWin ? "win" : "loss"}`}>
            {/* Outcome & Meta */}
            <div className="match-result-group">
              <span className={`match-outcome-text ${match.isWin ? "win" : "loss"}`}>
                {match.outcome}
              </span>
              <span className="match-meta-text">{match.mode}</span>
              <span className="match-meta-text" style={{ fontSize: "9px" }}>
                {match.duration} • {match.date}
              </span>
            </div>

            {/* Agent vs Rival */}
            <div className="match-agent-group">
              <img
                src={match.agentIcon}
                alt={match.agentName}
                className={`match-agent-avatar ${match.isWin ? "win" : "loss"}`}
              />
              <div>
                <div className="match-agent-name">{match.agentName}</div>
                <div className="match-rival-badge">
                  <span>vs</span>
                  <img
                    src={match.rivalIcon}
                    alt={match.rivalName}
                    style={{ width: "14px", height: "14px", borderRadius: "50%" }}
                  />
                  <span>{match.rivalName}</span>
                </div>
              </div>
            </div>

            {/* Loadout Weapon Icons */}
            <div className="match-loadout-group">
              {match.weapons.map((wUrl, idx) => (
                <div key={idx} className="loadout-icon-box">
                  <img src={wUrl} alt="Weapon" className="loadout-icon-img" />
                </div>
              ))}
            </div>

            {/* KDA & Combat Stats */}
            <div className="match-kda-group">
              <span className="match-kda-main">{match.kda}</span>
              <span className="match-kda-subs">
                CS/m: {match.csm} • ACS: {match.gpm}
              </span>
            </div>

            {/* AI Draft & Macro Score */}
            <div className="match-ai-score-group">
              <div className={`ai-score-circle ${match.aiScoreLow ? "low" : ""}`}>
                {match.aiScore}
              </div>
              <div className="ai-score-label">
                <span className="ai-score-title">{t.draftScore}</span>
                <span className="ai-score-lock" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <LockIcon size={10} />
                  <span>{t.aiMacroScore}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
