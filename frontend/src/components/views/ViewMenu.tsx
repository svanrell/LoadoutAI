"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useGameState, SyncedCompetitiveUpdate } from "@/hooks/useGameState";
import { useValorantData } from "@/hooks/useValorantData";
import { useLanguage } from "@/context/LanguageContext";
import { RefreshIcon } from "@/components/Icons";
import {
  getAgentIconUrl,
  getAgentIconByIdUrl,
  calculateCompetitiveChartData,
  buildMatchGroups,
} from "@/lib/menuLogic";
import {
  getRankIconUrl,
  getRankLargeIconUrl,
  getBaseTierIconUrl,
  getTierColor,
} from "@/lib/rankUtils";

export default function ViewMenu() {
  const { connectionStatus, playerProfile, isProfileLoading, requestPlayerProfile } = useGameState();
  const { agents } = useValorantData();
  const { t, language } = useLanguage();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: SyncedCompetitiveUpdate;
    x: number;
    y: number;
  } | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 500, height: 140 });

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const el = chartContainerRef.current;
    const updateSize = () => {
      const { clientWidth, clientHeight } = el;
      if (clientWidth > 0 && clientHeight > 0) {
        setChartDimensions({
          width: clientWidth,
          height: clientHeight,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    requestPlayerProfile(undefined, true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getAgentIcon = (name: string, fallbackUuid: string) =>
    getAgentIconUrl(agents, name, fallbackUuid);

  const getAgentIconById = (uuid: string) =>
    getAgentIconByIdUrl(agents, uuid);

  const defaultAvatar = getAgentIcon("Jett", "add6443c-41c1-48b0-a04a-a71c8b3269a9");

  // Historial de puntos de RR
  const competitiveUpdates = useMemo(() => {
    const raw = playerProfile?.competitiveUpdates || [];
    if (raw.length === 0) return [];
    return [...raw].reverse();
  }, [playerProfile?.competitiveUpdates]);

  // Gráfico de MMR competitivo (coordenadas, spline cúbico de Bézier y division bands)
  const chartData = useMemo(() => {
    return calculateCompetitiveChartData({
      competitiveUpdates,
      chartDimensions,
      language,
    });
  }, [competitiveUpdates, chartDimensions, language]);

  // Agrupación y medias diarias de las partidas sincronizadas de Riot
  const matchGroups = useMemo(() => {
    return buildMatchGroups({
      matches: playerProfile?.matches,
      agents,
      language,
      t,
      defaultAvatar,
    });
  }, [playerProfile?.matches, agents, defaultAvatar, t, language]);

  const streakPills = playerProfile?.streak || [];
  const winCountStreak = streakPills.filter((s) => s === "W").length;
  const lossCountStreak = streakPills.length - winCountStreak;

  return (
    <div id="viewMenu" className="state-view active">
      {/* 1. Filter Chips & Quick Refresh Bar */}
      <div className="filter-chips-bar" style={{ justifyContent: "flex-end", marginBottom: "0.875rem" }}>
        <div className="role-chips-group">
          <button
            className="cyber-btn-secondary"
            onClick={handleRefresh}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            <span style={{ display: "flex", transform: (isRefreshing || isProfileLoading) ? "rotate(360deg)" : "none", transition: "transform 0.5s ease" }}>
              <RefreshIcon size={12} />
            </span>
            <span>{isProfileLoading ? t.syncing : t.refresh}</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Stats Section (3-Column Layout) */}
      <div className="dashboard-hero-grid">
        {/* Card 1: Winrate & Match Count */}
        <div className="hero-stats-card">
          <div className="stats-card-header">
            <span className="stats-card-title">{t.performanceSummary}</span>
          </div>

          <div className="winrate-numbers-row">
            <div>
              <div className="stat-big-number">{playerProfile ? playerProfile.totalMatches : 0}</div>
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 600 }}>{t.matchesCount}</div>
            </div>
            <div>
              <div className="stat-big-percent">{playerProfile ? `${playerProfile.winRate}%` : "0%"}</div>
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontWeight: 600 }}>
                {t.winRate}
              </div>
            </div>
          </div>

          {/* Last 10 Matches streak bar */}
          <div className="streak-bar-wrap">
            <div className="streak-bar-label">
              <span>{t.last10Matches}</span>
              <span style={{ color: "var(--color-cyan)" }}>
                {winCountStreak}{t.winsShort} {lossCountStreak}{t.lossesShort}
              </span>
            </div>
            <div className="streak-pills-row">
              {streakPills.length > 0 ? (
                streakPills.map((s, idx) => (
                  <div key={idx} className={`streak-pill ${s === "W" ? "win" : "loss"}`} />
                ))
              ) : (
                <div style={{ fontSize: "0.625rem", color: "var(--text-dim)", padding: "0.125rem 0" }}>
                  {t.noRecentMatches}
                </div>
              )}
            </div>
          </div>

          {/* Top 3 Agents */}
          <div className="agent-mini-performance-row">
            {playerProfile?.topAgents && playerProfile.topAgents.length > 0 ? (
              playerProfile.topAgents.map((ag) => {
                const icon = getAgentIconById(ag.agentId);
                const found = agents.find((a) => a.uuid.toLowerCase() === ag.agentId.toLowerCase());
                return (
                  <div key={ag.agentId} className="agent-mini-item">
                    <img
                      src={icon}
                      alt={found?.displayName || "Agent"}
                      className="agent-mini-img"
                    />
                    <div className="agent-mini-text">
                      <div style={{ color: ag.winRate >= 50 ? "var(--color-cyan)" : "var(--color-red)" }}>
                        {ag.wins}{t.winsShort} {ag.losses}{t.lossesShort}
                      </div>
                      <div>{ag.winRate}%</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: "0.625rem", color: "var(--text-dim)", padding: "0.25rem 0" }}>
                {t.noAgentsPlayedSeason}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: LP / RR Rating Curve */}
        <div className="hero-stats-card">
          <div className="stats-card-header">
            <span className="stats-card-title">{t.rrGraphTitle}</span>
            <div className="rank-header-badge">
              <img
                src={getRankIconUrl(playerProfile?.currentTier ?? 0)}
                alt={playerProfile?.rankName || "Rank"}
                className="rank-header-icon"
              />
              <div className="rank-header-text-group">
                <span
                  className="rank-header-name"
                  style={{
                    color: getTierColor(playerProfile?.currentTier ?? 0),
                  }}
                >
                  {playerProfile?.rankName ? playerProfile.rankName.toUpperCase() : t.currentRank}
                </span>
                <span className="rank-header-rr">
                  • {playerProfile?.rankedRating ?? 0} RR
                </span>
              </div>
            </div>
          </div>

          <div
            ref={chartContainerRef}
            className="lp-chart-container"
            onMouseLeave={() => {
              setHoveredPoint(null);
            }}
          >
            {chartData ? (
              <>
                <svg
                  className="lp-chart-svg"
                  viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                  width={chartData.width}
                  height={chartData.height}
                >
                  <defs>
                    <linearGradient
                      id="lpCurveGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="rgba(56, 189, 248, 0.25)" />
                      <stop offset="100%" stopColor="rgba(56, 189, 248, 0.0)" />
                    </linearGradient>
                  </defs>

                  {/* Background Global Tier Bands */}
                  {chartData.globalTierBands.map((globalBand) => (
                    <g key={globalBand.globalName} className="chart-global-tier-band">
                      {/* Tier colored background strip */}
                      <rect
                        x={chartData.padLeft}
                        y={globalBand.topY}
                        width={chartData.chartW}
                        height={globalBand.bandHeight}
                        fill={globalBand.color}
                        fillOpacity={0.04}
                      />
                      {/* Upper separator line */}
                      <line
                        x1={chartData.padLeft}
                        y1={globalBand.topY}
                        x2={chartData.padLeft + chartData.chartW}
                        y2={globalBand.topY}
                        stroke={globalBand.color}
                        strokeOpacity={0.25}
                        strokeWidth={1}
                      />
                    </g>
                  ))}

                  {/* Division Subtle Subdivisions */}
                  {chartData.divisionBands.map((div) => {
                    return (
                      <g key={div.tierNum} className="chart-division-group">
                        {/* Division dashed line */}
                        <line
                          x1={chartData.padLeft}
                          y1={div.topY}
                          x2={chartData.padLeft + chartData.chartW}
                          y2={div.topY}
                          stroke="rgba(255, 255, 255, 0.08)"
                          strokeDasharray="3 3"
                        />
                      </g>
                    );
                  })}

                  {/* Y-Axis Rank Badge Pills on Left Side */}
                  {chartData.globalTierBands.map((globalBand) => {
                    const pillY = Math.max(
                      2,
                      Math.min(chartData.height - chartData.rem(1.5), globalBand.centerY - chartData.rem(0.6875))
                    );

                    return (
                      <g
                        key={globalBand.globalName}
                        transform={`translate(${chartData.rem(0.375)}, ${pillY})`}
                      >
                        {/* Sleek Pill Background */}
                        <rect
                          x={0}
                          y={0}
                          width={chartData.rem(5.25)}
                          height={chartData.rem(1.375)}
                          rx={chartData.rem(0.375)}
                          fill="rgba(10, 15, 26, 0.85)"
                          stroke={globalBand.color}
                          strokeWidth={1}
                          strokeOpacity={0.4}
                        />
                        {/* Tier Icon */}
                        <image
                          href={globalBand.globalIconUrl}
                          x={chartData.rem(0.25)}
                          y={chartData.rem(0.1875)}
                          width={chartData.rem(1)}
                          height={chartData.rem(1)}
                          preserveAspectRatio="xMidYMid meet"
                        />
                        {/* Tier Name: General Rank */}
                        <text
                          x={chartData.rem(1.5)}
                          y={chartData.rem(0.9375)}
                          fill={globalBand.color}
                          fontSize="0.5625rem"
                          fontWeight="800"
                          fontFamily="'Inter', system-ui, sans-serif"
                          letterSpacing="0.02em"
                        >
                          {globalBand.globalName.toUpperCase()}
                        </text>
                      </g>
                    );
                  })}

                  {/* Chart Bottom baseline */}
                  <line
                    x1={chartData.padLeft}
                    y1={chartData.padTop + chartData.chartH}
                    x2={chartData.padLeft + chartData.chartW}
                    y2={chartData.padTop + chartData.chartH}
                    stroke="rgba(255, 255, 255, 0.12)"
                  />

                  {/* Filled Area below curve */}
                  {chartData.areaPath && (
                    <path
                      d={chartData.areaPath}
                      fill="url(#lpCurveGradient)"
                    />
                  )}

                  {/* LP Bezier Curve Line */}
                  <path
                    d={chartData.linePath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="drop-shadow(0 2px 6px rgba(56, 189, 248, 0.5))"
                  />

                  {/* Match Points on Curve */}
                  {chartData.coords.map((pt, idx) => {
                    const isHovered =
                      hoveredPoint?.point?.matchId === pt.update.matchId;
                    const isLast = idx === chartData.coords.length - 1;
                    return (
                      <g key={pt.update.matchId || idx}>
                        {isLast && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="9"
                            fill="none"
                            stroke={pt.color}
                            strokeWidth="1.5"
                            className="chart-point-pulse"
                          />
                        )}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 7 : isLast ? 5.5 : 4}
                          fill={pt.color}
                          fillOpacity={0.35}
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 5.5 : isLast ? 4.5 : 3.5}
                          fill={pt.color}
                          stroke="#ffffff"
                          strokeWidth={isHovered || isLast ? 2 : 1.2}
                          className="lp-chart-point"
                          onMouseEnter={() => {
                            setHoveredPoint({
                              point: pt.update,
                              x: pt.x,
                              y: pt.y,
                            });
                          }}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Hover Tooltip Overlay */}
                {hoveredPoint && (
                  <div
                    className="lp-chart-tooltip"
                    style={{
                      left: `${hoveredPoint.x}px`,
                      top: `${hoveredPoint.y}px`,
                    }}
                  >
                    <div className="lp-chart-tooltip-header">
                      <span style={{ color: "var(--text-main)", fontWeight: 800 }}>
                        {hoveredPoint.point.mapName}
                      </span>
                      <span className="tooltip-dot">•</span>
                      <span>{hoveredPoint.point.dateStr}</span>
                    </div>
                    <div className="lp-chart-tooltip-main">
                      <img
                        src={getRankIconUrl(hoveredPoint.point.tier)}
                        alt={hoveredPoint.point.tierName}
                        className="lp-tooltip-rank-icon"
                      />
                      <div className="lp-tooltip-rank-info">
                        <span
                          className="lp-tooltip-rank-name"
                          style={{
                            color: getTierColor(hoveredPoint.point.tierName),
                          }}
                        >
                          {hoveredPoint.point.tierName}
                        </span>
                        <span className="lp-tooltip-rr-val">
                          {hoveredPoint.point.rankedRating} RR
                        </span>
                      </div>
                    </div>
                    <div className="lp-chart-tooltip-delta-row">
                      <span
                        className={`lp-tooltip-delta-badge ${
                          hoveredPoint.point.rankedRatingEarned >= 0 ? "gain" : "loss"
                        }`}
                      >
                        {hoveredPoint.point.rankedRatingEarned >= 0 ? "+" : ""}
                        {hoveredPoint.point.rankedRatingEarned} RR
                      </span>
                      {hoveredPoint.point.performanceBonus > 0 && (
                        <span className="lp-tooltip-bonus-badge">
                          ★ +{hoveredPoint.point.performanceBonus} bonus
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="lp-chart-empty-container">
                <svg
                  className="lp-chart-svg"
                  viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
                  width={chartDimensions.width}
                  height={chartDimensions.height}
                >
                  {[
                    { tierNum: 15, label: language === "es" ? "PLATINO" : "PLATINUM", color: "#06b6d4", topRatio: 0.00, heightRatio: 0.25 },
                    { tierNum: 12, label: language === "es" ? "ORO" : "GOLD", color: "#eab308", topRatio: 0.25, heightRatio: 0.25 },
                    { tierNum: 9, label: language === "es" ? "PLATA" : "SILVER", color: "#cbd5e1", topRatio: 0.50, heightRatio: 0.25 },
                    { tierNum: 6, label: language === "es" ? "BRONCE" : "BRONZE", color: "#b45309", topRatio: 0.75, heightRatio: 0.25 },
                  ].map((band, i) => {
                    const rootFontSize =
                      typeof window !== "undefined"
                        ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
                        : 16;
                    const rem = (v: number) => v * rootFontSize;
                    const topY = band.topRatio * chartDimensions.height;
                    const bandH = band.heightRatio * chartDimensions.height;
                    const pillY = topY + (bandH - rem(1.375)) / 2;
                    const padLeftFallback = rem(7.5);

                    return (
                      <g key={i}>
                        <rect
                          x={padLeftFallback}
                          y={topY}
                          width={Math.max(10, chartDimensions.width - padLeftFallback - rem(1.25))}
                          height={bandH}
                          fill={band.color}
                          fillOpacity={0.04}
                        />
                        <line
                          x1={padLeftFallback}
                          y1={topY}
                          x2={chartDimensions.width - rem(1.25)}
                          y2={topY}
                          stroke="rgba(255, 255, 255, 0.06)"
                          strokeDasharray="4 4"
                        />
                        {/* Sleek Pill Badge */}
                        <g transform={`translate(${rem(0.375)}, ${pillY})`}>
                          <rect
                            x={0}
                            y={0}
                            width={rem(5.25)}
                            height={rem(1.375)}
                            rx={rem(0.375)}
                            fill="rgba(12, 17, 29, 0.75)"
                            stroke={band.color}
                            strokeWidth={1}
                            strokeOpacity={0.35}
                          />
                          <image
                            href={getBaseTierIconUrl(band.tierNum)}
                            x={rem(0.25)}
                            y={rem(0.1875)}
                            width={rem(1)}
                            height={rem(1)}
                          />
                          <text
                            x={rem(1.5)}
                            y={rem(0.9375)}
                            fill={band.color}
                            fontSize="0.5625rem"
                            fontWeight="800"
                            fontFamily="'Inter', system-ui, sans-serif"
                            letterSpacing="0.02em"
                          >
                            {band.label}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>
                <div className="lp-chart-empty-overlay">
                  <div className="lp-empty-icon-wrap">
                    <img
                      src={getRankLargeIconUrl(playerProfile?.currentTier || 0)}
                      alt="Unranked"
                      className="lp-empty-rank-emblem"
                    />
                  </div>
                  <span className="lp-empty-title">
                    {t.noCompetitiveMatches6Months}
                  </span>
                  <span className="lp-empty-subtitle">
                    {t.playCompetitiveToTrackRR}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Radar Launcher & Tactical Standby Widget */}
        <div className="hero-stats-card">
          <div className="stats-card-header">
            <span className="stats-card-title">{t.liveRadarTitle}</span>
            <span
              style={{
                fontSize: "0.625rem",
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
              <div style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "var(--color-cyan)" }} />
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
              {connectionStatus === "offline" ? t.clientOfflineText : t.clientDetectedText}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Match History List (Tracker.gg Daily Layout) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginTop: "0.375rem" }}>
        {matchGroups.length > 0 ? (
          matchGroups.map((group, gIdx) => (
            <div key={gIdx} className="daily-group-container">
              {/* Daily Header Summary Row */}
              <div className="daily-header-row">
                <div className="daily-date-title">
                  <span>{group.dateTitle}</span>
                  <span className="daily-count-badge">{group.gameCount}</span>
                </div>

                <div className="daily-record-text">
                  <span className="win">{group.wins} {t.winsShort}</span>
                  <span className="sep">{"//"}</span>
                  <span className="loss">{group.losses} {t.lossesShort}</span>
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
                      <span style={{ color: "var(--text-muted)", margin: "0 0.25rem" }}>:</span>
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
          ))
        ) : (
          <div
            className="daily-group-container"
            style={{
              padding: "2rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-main)" }}>
              {t.noMatchesFound6Months}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {t.playMatchesToSyncHistory}
            </span>
          </div>
        )}

        {/* End of Results footer */}
        {matchGroups.length > 0 && (
          <div className="end-of-results-text">{t.endOfResults}</div>
        )}
      </div>
    </div>
  );
}
