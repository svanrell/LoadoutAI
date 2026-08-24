"use client";

import { useState, useMemo } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useValorantData } from "@/hooks/useValorantData";
import { useLanguage } from "@/context/LanguageContext";
import { RefreshIcon } from "@/components/Icons";

const TIER_NAMES_MAP: Record<number, string> = {
  0: "Unranked",
  1: "Unranked",
  2: "Unranked",
  3: "Iron 1",
  4: "Iron 2",
  5: "Iron 3",
  6: "Bronze 1",
  7: "Bronze 2",
  8: "Bronze 3",
  9: "Silver 1",
  10: "Silver 2",
  11: "Silver 3",
  12: "Gold 1",
  13: "Gold 2",
  14: "Gold 3",
  15: "Platinum 1",
  16: "Platinum 2",
  17: "Platinum 3",
  18: "Diamond 1",
  19: "Diamond 2",
  20: "Diamond 3",
  21: "Ascendant 1",
  22: "Ascendant 2",
  23: "Ascendant 3",
  24: "Immortal 1",
  25: "Immortal 2",
  26: "Immortal 3",
  27: "Radiant",
};

const TIER_COLORS: Record<string, string> = {
  iron: "#6c757d",
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd000",
  platinum: "#00f0ff",
  diamond: "#c084fc",
  ascendant: "#10b981",
  immortal: "#f43f5e",
  radiant: "#fef08a",
  unranked: "#8892b0",
};

function resolveTierName(tier: number): string {
  return TIER_NAMES_MAP[tier] || "Unranked";
}

function getTierColor(tierName: string) {
  const lower = (tierName || "").toLowerCase();
  for (const [key, color] of Object.entries(TIER_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#00f0ff";
}

function getTierShortLabel(tierName: string) {
  const lower = (tierName || "").toLowerCase();
  if (lower.includes("iron")) return "IRON";
  if (lower.includes("bronze")) return "BRON";
  if (lower.includes("silver")) return "SILV";
  if (lower.includes("gold")) return "GOLD";
  if (lower.includes("platinum")) return "PLAT";
  if (lower.includes("diamond")) return "DIAM";
  if (lower.includes("ascendant")) return "ASCE";
  if (lower.includes("immortal")) return "IMMO";
  if (lower.includes("radiant")) return "RAD";
  return "UNRK";
}

export default function ViewMenu() {
  const { setView, connectionStatus, playerProfile, isProfileLoading, requestPlayerProfile } = useGameState();
  const { agents } = useValorantData();
  const { t, language } = useLanguage();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: any;
    x: number;
    y: number;
  } | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    requestPlayerProfile();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Formatear tiempo transcurrido según idioma activo
  const formatTimeAgo = (timeAgoStr: string, timestamp?: number) => {
    if (timestamp) {
      const diff = Math.max(0, Date.now() - timestamp);
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return language === "es" ? `Hace ${mins} min` : `${mins}m ago`;
      const hours = Math.floor(diff / 3600000);
      if (hours < 24) return language === "es" ? `Hace ${hours} h` : `${hours}h ago`;
      const days = Math.floor(diff / 86400000);
      if (days < 30) return language === "es" ? `Hace ${days} d` : `${days}d ago`;
      const months = Math.floor(days / 30);
      if (months < 12) return language === "es" ? `Hace ${months} m` : `${months}mo ago`;
      const years = Math.floor(months / 12);
      return language === "es" ? `Hace ${years} a` : `${years}y ago`;
    }
    if (!timeAgoStr) return "";
    if (language === "es") {
      return timeAgoStr
        .replace(/(\d+)\s*m\s*ago/i, "Hace $1 min")
        .replace(/(\d+)\s*h\s*ago/i, "Hace $1 h")
        .replace(/(\d+)\s*d\s*ago/i, "Hace $1 d")
        .replace(/(\d+)\s*mo\s*ago/i, "Hace $1 m")
        .replace(/(\d+)\s*y\s*ago/i, "Hace $1 a");
    }
    return timeAgoStr;
  };

  // Formatear nombre de modo de juego según idioma
  const formatMode = (modeName: string) => {
    const lower = (modeName || "").toLowerCase();
    if (language === "es") {
      if (lower.includes("compet") || lower.includes("comp")) return "Competitivo";
      if (lower.includes("unrated") || lower.includes("normal") || lower.includes("standard")) return "Normal";
      if (lower.includes("swiftplay") || lower.includes("swift")) return "Fiebre rápida";
      if (lower.includes("spikerush") || lower.includes("spike")) return "Fiebre de la Spike";
      if (lower.includes("deathmatch") || lower.includes("dm")) return "Combate a muerte";
      if (lower.includes("escalation")) return "Carrera armamentística";
      if (lower.includes("custom")) return "Personalizada";
      return modeName;
    }
    return modeName;
  };

  const getAgentIcon = (name: string, fallbackUuid: string) => {
    const found = agents.find((a) => a.displayName.toLowerCase() === name.toLowerCase());
    return (
      found?.displayIcon ||
      found?.bustPortrait ||
      `https://media.valorant-api.com/agents/${fallbackUuid}/displayicon.png`
    );
  };

  const getAgentIconById = (uuid: string) => {
    if (!uuid) return "https://media.valorant-api.com/agents/add6443c-41c1-48b0-a04a-a71c8b3269a9/displayicon.png";
    const found = agents.find((a) => a.uuid.toLowerCase() === uuid.toLowerCase());
    return found?.displayIcon || found?.bustPortrait || "https://media.valorant-api.com/agents/add6443c-41c1-48b0-a04a-a71c8b3269a9/displayicon.png";
  };

  const defaultAvatar = getAgentIcon("Jett", "add6443c-41c1-48b0-a04a-a71c8b3269a9");
  const yoruIcon = getAgentIcon("Yoru", "7f94d92c-4234-0922-4ce0-46670fae4536");
  const omenIcon = getAgentIcon("Omen", "8e253930-4c05-31dd-1b6c-968525494517");
  const sovaIcon = getAgentIcon("Sova", "ded3520f-4264-bfed-162d-b080e2abccf9");

  // Obtener la tarjeta de jugador real (Player Card) del juego o fallback oficial
  const getPlayerCardUrl = (cardId?: string) => {
    if (!cardId) {
      return "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png";
    }
    return `https://media.valorant-api.com/playercards/${cardId}/smallart.png`;
  };

  // Foto de perfil oficial del juego (Player Card)
  const userAvatar = getPlayerCardUrl(playerProfile?.playerCardId);

  // Historial de puntos de RR
  const competitiveUpdates = useMemo(() => {
    const raw = playerProfile?.competitiveUpdates || [];
    if (raw.length === 0) return [];
    // Riot devuelve en orden descendente (más nuevo a más viejo), revertir para graficar de izquierda a derecha
    return [...raw].reverse();
  }, [playerProfile?.competitiveUpdates]);

  const chartData = useMemo(() => {
    if (competitiveUpdates.length === 0) return null;

    const padLeft = 45;
    const padRight = 20;
    const padTop = 18;
    const padBottom = 18;
    const width = 500;
    const height = 120;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    // Calcular MMR absoluto de cada punto: tier * 100 + rankedRating
    const mmrValues = competitiveUpdates.map((u) => u.tier * 100 + u.rankedRating);
    let minMmr = Math.min(...mmrValues);
    let maxMmr = Math.max(...mmrValues);

    if (minMmr === maxMmr) {
      minMmr -= 30;
      maxMmr += 30;
    }

    const range = Math.max(30, maxMmr - minMmr);
    const yMin = minMmr - range * 0.15;
    const yMax = maxMmr + range * 0.15;

    // Coordenadas de los puntos
    const count = competitiveUpdates.length;
    const coords = competitiveUpdates.map((update, i) => {
      const val = update.tier * 100 + update.rankedRating;
      const x = count === 1 ? padLeft + chartW / 2 : padLeft + (i / (count - 1)) * chartW;
      const y = padTop + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
      return {
        x,
        y,
        update,
        color: getTierColor(update.tierName),
      };
    });

    // Generar curva suave (spline)
    let linePath = "";
    if (coords.length === 1) {
      linePath = `M ${coords[0].x - 30} ${coords[0].y} L ${coords[0].x + 30} ${coords[0].y}`;
    } else if (coords.length === 2) {
      linePath = `M ${coords[0].x} ${coords[0].y} L ${coords[1].x} ${coords[1].y}`;
    } else {
      linePath = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i === 0 ? i : i - 1];
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
    }

    const areaPath =
      coords.length >= 2
        ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} 120 L ${coords[0].x.toFixed(1)} 120 Z`
        : "";

    // 4 Líneas de referencia en el eje Y
    const gridTicks = [];
    const tickCount = 4;
    for (let i = 0; i < tickCount; i++) {
      const mmrVal = yMax - (i / (tickCount - 1)) * (yMax - yMin);
      const tierNum = Math.max(0, Math.floor(mmrVal / 100));
      const tierName = resolveTierName(tierNum);
      const label = getTierShortLabel(tierName);
      const color = getTierColor(tierName);
      const y = padTop + (i / (tickCount - 1)) * chartH;
      gridTicks.push({ y, label, color });
    }

    return {
      coords,
      linePath,
      areaPath,
      gridTicks,
    };
  }, [competitiveUpdates]);

  // Fallback Mock Groups
  const defaultMatchGroups = [
    {
      dateTitle: "Feb 8",
      gameCount: 1,
      wins: 1,
      losses: 0,
      dailyKd: "1.4",
      dailyKdaLine: "17 K // 12 D // 6 A",
      dailyKdaVal: "1.42 K/D/A",
      dailyDd: "+76",
      dailyHs: "11%",
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
          dd: "+76",
          hs: "11%",
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
      dailyDd: "+33",
      dailyHs: "14%",
      dailyAcs: "270",
      matches: [
        {
          id: "m-yoru-2",
          isWin: true,
          agentName: "Yoru",
          agentIcon: yoruIcon,
          metaText: `${formatTimeAgo("6mo ago")} // ${t.normal}`,
          mapName: "Icebox",
          placement: "MVP",
          isMvp: true,
          scoreWon: 13,
          scoreLost: 8,
          badges: [
            { label: "Ace", type: "gold" },
            { label: "1v3 Clutch", type: "gold" },
          ],
          kd: "1.7",
          kda: "25 / 15 / 5",
          dd: "+87",
          hs: "16%",
          acs: "339",
        },
        {
          id: "m-sova-1",
          isWin: false,
          agentName: "Sova",
          agentIcon: sovaIcon,
          metaText: `${formatTimeAgo("6mo ago")} // ${t.normal}`,
          mapName: "Haven",
          placement: "6th",
          isMvp: false,
          scoreWon: 7,
          scoreLost: 13,
          badges: [{ label: t.defeat, type: "red" }],
          kd: "0.5",
          kda: "10 / 20 / 10",
          dd: "-23",
          hs: "10%",
          acs: "198",
        },
      ],
    },
  ];

  // Agrupación dinámica de las partidas sincronizadas de Riot
  const matchGroups = useMemo(() => {
    if (!playerProfile || !playerProfile.matches || playerProfile.matches.length === 0) {
      return defaultMatchGroups;
    }

    const groupMap: Record<string, typeof playerProfile.matches> = {};
    for (const m of playerProfile.matches) {
      const d = m.dateTitle || "Recientes";
      if (!groupMap[d]) groupMap[d] = [];
      groupMap[d].push(m);
    }

    return Object.entries(groupMap).map(([dateTitle, list]) => {
      const wins = list.filter((m) => m.isWin).length;
      const losses = list.length - wins;
      const totalKills = list.reduce((acc, m) => acc + m.kills, 0);
      const totalDeaths = list.reduce((acc, m) => acc + m.deaths, 0);
      const totalAssists = list.reduce((acc, m) => acc + m.assists, 0);
      const dailyKd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
      const dailyAcs = Math.round(list.reduce((acc, m) => acc + m.acs, 0) / list.length);
      const dailyHs = Math.round(list.reduce((acc, m) => acc + m.hsPercent, 0) / list.length);
      const dailyDd = Math.round(list.reduce((acc, m) => acc + m.damageDelta, 0) / list.length);

      return {
        dateTitle,
        gameCount: list.length,
        wins,
        losses,
        dailyKd,
        dailyKdaLine: `${totalKills} K // ${totalDeaths} D // ${totalAssists} A`,
        dailyKdaVal: `${dailyKd} K/D/A`,
        dailyDd: `${dailyDd >= 0 ? "+" : ""}${dailyDd}`,
        dailyHs: `${dailyHs}%`,
        dailyAcs: `${dailyAcs}`,
        matches: list.map((m) => {
          const foundAgent = agents.find((a) => a.uuid.toLowerCase() === m.agentId.toLowerCase());
          const agentIcon = foundAgent?.displayIcon || foundAgent?.bustPortrait || defaultAvatar;
          const agentName = foundAgent?.displayName || "Agent";

          return {
            id: m.id,
            isWin: m.isWin,
            agentName,
            agentIcon,
            metaText: `${formatTimeAgo(m.timeAgo, m.gameStartTime)} // ${formatMode(m.modeName)}`,
            mapName: m.mapName,
            placement: m.isMvp ? "MVP" : m.placement,
            isMvp: m.isMvp,
            scoreWon: m.scoreWon,
            scoreLost: m.scoreLost,
            badges: m.isMvp
              ? [{ label: t.matchMvp, type: "gold" }]
              : m.isWin
              ? [{ label: t.victory, type: "default" }]
              : [{ label: t.defeat, type: "red" }],
            kd: m.kd,
            kda: m.kda,
            dd: `${m.damageDelta >= 0 ? "+" : ""}${m.damageDelta}`,
            hs: `${m.hsPercent}%`,
            acs: `${m.acs}`,
          };
        }),
      };
    });
  }, [playerProfile, agents, defaultAvatar, t, language]);

  const streakPills = playerProfile?.streak?.length
    ? playerProfile.streak
    : ["L", "W", "L", "L", "W", "W", "L", "W", "W", "L"];

  const winCountStreak = streakPills.filter((s) => s === "W").length;
  const lossCountStreak = streakPills.length - winCountStreak;

  return (
    <div id="viewMenu" className="state-view active">
      {/* 1. Filter Chips & Quick Refresh Bar */}
      <div className="filter-chips-bar" style={{ justifyContent: "flex-end", marginBottom: "14px" }}>
        <div className="role-chips-group">
          <button
            className="cyber-btn-secondary"
            onClick={handleRefresh}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span style={{ display: "flex", transform: (isRefreshing || isProfileLoading) ? "rotate(360deg)" : "none", transition: "transform 0.5s ease" }}>
              <RefreshIcon size={12} />
            </span>
            <span>{isProfileLoading ? "Sincronizando..." : t.refresh}</span>
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
              <div className="stat-big-number">{playerProfile ? playerProfile.totalMatches : 68}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>{t.matchesCount}</div>
            </div>
            <div>
              <div className="stat-big-percent">{playerProfile ? `${playerProfile.winRate}%` : "60.3%"}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>
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
              {streakPills.map((s, idx) => (
                <div key={idx} className={`streak-pill ${s === "W" ? "win" : "loss"}`} />
              ))}
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
              <>
                <div className="agent-mini-item">
                  <img src={defaultAvatar} alt="Jett" className="agent-mini-img" />
                  <div className="agent-mini-text">
                    <div style={{ color: "var(--color-red)" }}>0{t.winsShort} 1{t.lossesShort}</div>
                    <div>0%</div>
                  </div>
                </div>
                <div className="agent-mini-item">
                  <img src={omenIcon} alt="Omen" className="agent-mini-img" />
                  <div className="agent-mini-text">
                    <div style={{ color: "var(--color-cyan)" }}>1{t.winsShort} 0{t.lossesShort}</div>
                    <div>100%</div>
                  </div>
                </div>
                <div className="agent-mini-item">
                  <img src={sovaIcon} alt="Sova" className="agent-mini-img" />
                  <div className="agent-mini-text">
                    <div style={{ color: "var(--color-red)" }}>0{t.winsShort} 1{t.lossesShort}</div>
                    <div>0%</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2: LP / RR Rating Curve */}
        <div className="hero-stats-card">
          <div className="stats-card-header">
            <span className="stats-card-title">{t.rrGraphTitle}</span>
            <span style={{ fontSize: "11px", color: "var(--color-cyan)", fontWeight: 700 }}>
              {playerProfile?.rankName ? `${playerProfile.rankName.toUpperCase()} (${playerProfile.rankedRating} RR)` : t.currentRank}
            </span>
          </div>

          <div
            className="lp-chart-container"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {chartData ? (
              <>
                <svg
                  className="lp-chart-svg"
                  viewBox="0 0 500 120"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="lpCurveGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="rgba(56, 189, 248, 0.18)" />
                      <stop offset="100%" stopColor="rgba(56, 189, 248, 0.0)" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines & Y Axis Tier Labels */}
                  {chartData.gridTicks.map((tick, idx) => (
                    <g key={idx}>
                      <line
                        x1="0"
                        y1={tick.y}
                        x2="500"
                        y2={tick.y}
                        stroke="rgba(255,255,255,0.06)"
                        strokeDasharray="3 3"
                      />
                      <text
                        x="5"
                        y={tick.y + 3}
                        fill={tick.color}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {tick.label}
                      </text>
                    </g>
                  ))}

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
                    strokeWidth="2"
                    filter="drop-shadow(0 2px 4px rgba(56, 189, 248, 0.3))"
                  />

                  {/* Points on Curve */}
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
                            r="7"
                            fill="none"
                            stroke={pt.color}
                            strokeWidth="1"
                            opacity="0.4"
                          />
                        )}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 5.5 : isLast ? 4.5 : 3.5}
                          fill={pt.color}
                          stroke="#fff"
                          strokeWidth={isHovered || isLast ? 1.5 : 1}
                          className="lp-chart-point"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget
                              .closest(".lp-chart-container")
                              ?.getBoundingClientRect();
                            if (rect) {
                              const px = (pt.x / 500) * rect.width;
                              const py = (pt.y / 120) * rect.height;
                              setHoveredPoint({
                                point: pt.update,
                                x: px,
                                y: py,
                              });
                            }
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
                      {hoveredPoint.point.mapName} • {hoveredPoint.point.dateStr}
                    </div>
                    <div className="lp-chart-tooltip-rank">
                      <span
                        style={{
                          color: getTierColor(hoveredPoint.point.tierName),
                        }}
                      >
                        {hoveredPoint.point.tierName}
                      </span>
                      <span>{hoveredPoint.point.rankedRating} RR</span>
                    </div>
                    <div
                      className="lp-chart-tooltip-delta"
                      style={{
                        color:
                          hoveredPoint.point.rankedRatingEarned >= 0
                            ? "var(--color-cyan)"
                            : "var(--color-red)",
                      }}
                    >
                      {hoveredPoint.point.rankedRatingEarned >= 0 ? "+" : ""}
                      {hoveredPoint.point.rankedRatingEarned} RR
                      {hoveredPoint.point.performanceBonus > 0 && (
                        <span style={{ color: "#ffd000", marginLeft: "4px" }}>
                          ⭐ +{hoveredPoint.point.performanceBonus}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <svg
                  className="lp-chart-svg"
                  viewBox="0 0 500 120"
                  preserveAspectRatio="none"
                >
                  <line
                    x1="0"
                    y1="20"
                    x2="500"
                    y2="20"
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1="0"
                    y1="50"
                    x2="500"
                    y2="50"
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1="0"
                    y1="80"
                    x2="500"
                    y2="80"
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1="0"
                    y1="110"
                    x2="500"
                    y2="110"
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />

                  <text
                    x="5"
                    y="24"
                    fill="#38bdf8"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    PLAT
                  </text>
                  <text
                    x="5"
                    y="54"
                    fill="#f59e0b"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    GOLD
                  </text>
                  <text
                    x="5"
                    y="84"
                    fill="#c0c0c0"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    SILV
                  </text>
                  <text
                    x="5"
                    y="114"
                    fill="#cd7f32"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    BRON
                  </text>

                  <line
                    x1="45"
                    y1="60"
                    x2="480"
                    y2="60"
                    stroke="rgba(0, 240, 255, 0.2)"
                    strokeDasharray="4 4"
                  />
                </svg>
                <div
                  className="lp-chart-empty"
                  style={{ position: "absolute", inset: 0 }}
                >
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Sin partidas clasificatorias recientes
                  </span>
                  <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>
                    Juega en modo Competitivo para registrar tu evolución de RR
                  </span>
                </div>
              </>
            )}
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
