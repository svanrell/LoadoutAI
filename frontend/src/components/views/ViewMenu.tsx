"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useValorantData } from "@/hooks/useValorantData";
import { useLanguage } from "@/context/LanguageContext";
import { RefreshIcon } from "@/components/Icons";

export default function ViewMenu() {
  const { setView, connectionStatus } = useGameState();
  const { agents } = useValorantData();
  const { t } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState<"history" | "account" | "agents">("history");
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

  const userAvatar = getAgentIcon("Jett", "add6443c-41c1-48b0-a04a-a71c8b3269a9");
  const yoruIcon = getAgentIcon("Yoru", "7f94d92c-4234-0922-4ce0-46670fae4536");
  const omenIcon = getAgentIcon("Omen", "8e253930-4c05-31dd-1b6c-968525494517");
  const sovaIcon = getAgentIcon("Sova", "ded3520f-4264-bfed-162d-b080e2abccf9");

  // Tracker.gg Daily Match Groups
  const matchGroups = [
    {
      dateTitle: "Feb 8",
      gameCount: 1,
      wins: 1,
      losses: 0,
      dailyKd: "1.4",
      dailyKdaLine: "17 K // 12 D // 6 A",
      dailyKdaVal: "1.42 K/D/A",
      dailyDd: "76",
      dailyHs: "11",
      dailyAcs: "291",
      matches: [
        {
          id: "m-yoru-1",
          isWin: true,
          agentName: "Yoru",
          agentIcon: yoruIcon,
          metaText: `6mo ago // ${t.normal}`,
          mapName: "Bind",
          placement: "2nd",
          isMvp: false,
          scoreWon: 13,
          scoreLost: 4,
          badges: [{ label: "3k x3", type: "default" }],
          kd: "1.4",
          kda: "17 / 12 / 6",
          dd: "76",
          hs: "11",
          acs: "291",
        },
      ],
    },
    {
      dateTitle: "Feb 7",
      gameCount: 2,
      wins: 1,
      losses: 1,
      dailyKd: "1.0",
      dailyKdaLine: "35 K // 35 D // 15 A",
      dailyKdaVal: "1.00 K/D/A",
      dailyDd: "33",
      dailyHs: "14",
      dailyAcs: "270",
      matches: [
        {
          id: "m-yoru-2",
          isWin: true,
          agentName: "Yoru",
          agentIcon: yoruIcon,
          metaText: `6mo ago // ${t.normal}`,
          mapName: "Icebox",
          placement: "MVP",
          isMvp: true,
          scoreWon: 13,
          scoreLost: 8,
          badges: [
            { label: "Ace", type: "gold" },
            { label: "1v3 Clutch", type: "gold" },
            { label: "4k", type: "default" },
            { label: "High KAST", type: "default" },
            { label: "+2", type: "default" },
          ],
          kd: "1.7",
          kda: "25 / 15 / 5",
          dd: "87",
          hs: "16",
          acs: "339",
        },
        {
          id: "m-sova-1",
          isWin: false,
          agentName: "Sova",
          agentIcon: sovaIcon,
          metaText: `6mo ago // ${t.normal}`,
          mapName: "Haven",
          placement: "6th",
          isMvp: false,
          scoreWon: 7,
          scoreLost: 13,
          badges: [{ label: "Victim", type: "red" }],
          kd: "0.5",
          kda: "10 / 20 / 10",
          dd: "-23",
          hs: "10",
          acs: "198",
        },
      ],
    },
  ];

  return (
    <div id="viewMenu" className="state-view active">
      {/* 1. Sub-navigation tabs */}
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
      <div className="filter-chips-bar" style={{ justifyContent: "flex-end" }}>
        <div className="role-chips-group">
          <select className="cyber-input" style={{ fontSize: "11px", padding: "5px 8px" }}>
            <option>{t.filterAgents}</option>
            <option>Yoru</option>
            <option>Sova</option>
            <option>Jett</option>
            <option>Omen</option>
            <option>Reyna</option>
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

      {/* 4. Hero Stats Section (3-Column Layout) */}
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
        </div>
      </div>

      {/* 5. Match History List (Tracker.gg Daily Layout) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "6px" }}>
        {matchGroups.map((group, gIdx) => (
          <div key={gIdx} className="daily-group-container">
            {/* Daily Header Summary Row */}
            <div className="daily-header-row">
              <div className="daily-date-title">
                <span>{group.dateTitle}</span>
                <span className="daily-count-badge">{group.gameCount}</span>
              </div>

              <div className="daily-record-text">
                <span className="win">{group.wins} W</span>
                <span className="sep">//</span>
                <span className="loss">{group.losses} L</span>
              </div>

              <div />

              <div className="daily-stat-header">
                <span>K/D</span>
                <span className="daily-stat-value">{group.dailyKd}</span>
              </div>

              <div className="daily-stat-header" style={{ textAlign: "center" }}>
                <span>{group.dailyKdaLine}</span>
                <span className="daily-stat-value">{group.dailyKdaVal}</span>
              </div>

              <div className="daily-stat-header">
                <span>DDΔ</span>
                <span className="daily-stat-value">{group.dailyDd}</span>
              </div>

              <div className="daily-stat-header">
                <span>HS%</span>
                <span className="daily-stat-value">{group.dailyHs}</span>
              </div>

              <div className="daily-stat-header">
                <span>ACS</span>
                <span className="daily-stat-value">{group.dailyAcs}</span>
              </div>

              <div />
            </div>

            {/* Match Rows inside Group */}
            {group.matches.map((m) => (
              <div key={m.id} className={`tracker-match-card ${m.isWin ? "win" : "loss"}`}>
                <div className={`tracker-left-bar ${m.isWin ? "win" : "loss"}`} />

                {/* Col 1: Agent Portrait & Map Placement */}
                <div className="tracker-agent-col">
                  <img src={m.agentIcon} alt={m.agentName} className="tracker-agent-avatar" />
                  <div className="tracker-agent-info">
                    <span className="tracker-meta-sub">{m.metaText}</span>
                    <div className="tracker-map-name">
                      <span>{m.mapName}</span>
                      <span className={`tracker-placement-badge ${m.isMvp ? "mvp" : ""}`}>
                        {m.placement}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Col 2: Score */}
                <div className="tracker-score-col">
                  <span className="tracker-col-label">{t.score}</span>
                  <div className="tracker-score-val">
                    <span className={m.isWin ? "score-win" : "score-loss"}>{m.scoreWon}</span>
                    <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>:</span>
                    <span className={m.isWin ? "score-loss" : "score-win"}>{m.scoreLost}</span>
                  </div>
                </div>

                {/* Col 3: Badges / Highlights */}
                <div className="tracker-badges-col">
                  {m.badges.map((b, bIdx) => (
                    <span
                      key={bIdx}
                      className={`tracker-tag-badge ${
                        b.type === "gold" ? "gold" : b.type === "red" ? "red" : ""
                      }`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>

                {/* Col 4: K/D Ratio */}
                <div className="tracker-stat-col">
                  <span className="tracker-col-label">K/D</span>
                  <span
                    className={`tracker-stat-val ${
                      parseFloat(m.kd) >= 1.0 ? "positive" : "negative"
                    }`}
                  >
                    {m.kd}
                  </span>
                </div>

                {/* Col 5: K/D/A Numbers */}
                <div className="tracker-stat-col" style={{ alignItems: "center" }}>
                  <span className="tracker-col-label">K/D/A</span>
                  <span className="tracker-stat-val">{m.kda}</span>
                </div>

                {/* Col 6: DDΔ */}
                <div className="tracker-stat-col">
                  <span className="tracker-col-label">DDΔ</span>
                  <span className="tracker-stat-val">{m.dd}</span>
                </div>

                {/* Col 7: HS% */}
                <div className="tracker-stat-col">
                  <span className="tracker-col-label">HS%</span>
                  <span className="tracker-stat-val">{m.hs}</span>
                </div>

                {/* Col 8: ACS */}
                <div className="tracker-stat-col">
                  <span className="tracker-col-label">ACS</span>
                  <span className="tracker-stat-val">{m.acs}</span>
                </div>

                {/* Col 9: 3 dots menu */}
                <div className="tracker-dots-menu">⋮</div>
              </div>
            ))}
          </div>
        ))}

        {/* End of Results footer */}
        <div className="end-of-results-text">{t.endOfResults}</div>
      </div>
    </div>
  );
}
