"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useValorantData } from "@/hooks/useValorantData";
import { useLanguage } from "@/context/LanguageContext";
import { RefreshIcon } from "@/components/Icons";

import {
  resolveTierName,
  getTierColor,
  getTierBgColor,
  getTierShortLabel,
  getRankIconUrl,
  getRankLargeIconUrl,
  getGlobalTierName,
  getExactTierName,
  getBaseTierIconUrl,
} from "@/lib/rankUtils";

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
  const [hoveredDivision, setHoveredDivision] = useState<{
    tierNum: number;
    exactName: string;
    globalName: string;
    color: string;
    iconUrl: string;
    centerY: number;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredGlobalBandKey, setHoveredGlobalBandKey] = useState<string | null>(null);

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

    const padLeft = 82;
    const padRight = 16;
    const padTop = 14;
    const padBottom = 16;
    const width = chartDimensions.width;
    const height = chartDimensions.height;
    const chartW = Math.max(10, width - padLeft - padRight);
    const chartH = Math.max(10, height - padTop - padBottom);

    // Calcular MMR absoluto de cada punto: tier * 100 + rankedRating
    const tierValues = competitiveUpdates.map((u) => Math.max(3, u.tier));
    const minTier = Math.min(...tierValues);
    const maxTier = Math.max(...tierValues);

    // Rango visible de divisiones (Tier Bands)
    let displayMinTier = Math.max(3, minTier - 1);
    let displayMaxTier = Math.min(27, maxTier + 1);

    while (displayMaxTier - displayMinTier < 3 && (displayMinTier > 3 || displayMaxTier < 27)) {
      if (displayMinTier > 3) displayMinTier--;
      if (displayMaxTier - displayMinTier < 3 && displayMaxTier < 27) displayMaxTier++;
    }

    const yMin = displayMinTier * 100;
    const yMax = (displayMaxTier + 1) * 100;
    const mmrSpan = Math.max(100, yMax - yMin);

    const getY = (val: number) => {
      const clamped = Math.max(yMin, Math.min(yMax, val));
      return padTop + chartH - ((clamped - yMin) / mmrSpan) * chartH;
    };

    // Coordenadas de los puntos exactas en px
    const count = competitiveUpdates.length;
    const coords = competitiveUpdates.map((update, i) => {
      const val = Math.max(3, update.tier) * 100 + (update.rankedRating || 0);
      const x = count === 1 ? padLeft + chartW / 2 : padLeft + (i / (count - 1)) * chartW;
      const y = getY(val);
      return {
        x,
        y,
        update,
        color: getTierColor(update.tierName),
      };
    });

    // Generar curva suave (spline cúbico)
    let linePath = "";
    if (coords.length === 1) {
      linePath = `M ${coords[0].x - 20} ${coords[0].y} L ${coords[0].x + 20} ${coords[0].y}`;
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

    const baselineY = (padTop + chartH).toFixed(1);
    const areaPath =
      coords.length >= 2
        ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${baselineY} L ${coords[0].x.toFixed(1)} ${baselineY} Z`
        : "";

    // Construir Division Bands individuales
    const currentLang = (language as "es" | "en") || "es";
    const allDivisions: number[] = [];
    for (let tNum = displayMinTier; tNum <= displayMaxTier; tNum++) {
      allDivisions.push(tNum);
    }

    const divisionBands = allDivisions.map((tNum) => {
      const topY = getY((tNum + 1) * 100);
      const bottomY = getY(tNum * 100);
      const centerY = (topY + bottomY) / 2;
      const bandHeight = Math.max(0, bottomY - topY);
      const tierName = resolveTierName(tNum);
      const exactName = getExactTierName(tNum, currentLang);
      const globalName = getGlobalTierName(tNum, currentLang);
      const color = getTierColor(tNum);
      const iconUrl = getRankIconUrl(tNum);
      const globalIconUrl = getBaseTierIconUrl(tNum);
      const isBaseRank = tNum % 3 === 0;

      return {
        tierNum: tNum,
        topY,
        bottomY,
        centerY,
        bandHeight,
        tierName,
        exactName,
        globalName,
        color,
        iconUrl,
        globalIconUrl,
        isBaseRank,
      };
    });

    // Construir Global Tier Bands agrupados por tier principal (Bronce, Plata, Oro, etc.)
    const globalGroupsMap = new Map<string, {
      globalName: string;
      color: string;
      globalIconUrl: string;
      divisions: typeof divisionBands;
      topY: number;
      bottomY: number;
      centerY: number;
      bandHeight: number;
    }>();

    for (const div of divisionBands) {
      const key = div.globalName;
      if (!globalGroupsMap.has(key)) {
        globalGroupsMap.set(key, {
          globalName: div.globalName,
          color: div.color,
          globalIconUrl: div.globalIconUrl,
          divisions: [div],
          topY: div.topY,
          bottomY: div.bottomY,
          centerY: div.centerY,
          bandHeight: div.bandHeight,
        });
      } else {
        const grp = globalGroupsMap.get(key)!;
        grp.divisions.push(div);
        grp.topY = Math.min(grp.topY, div.topY);
        grp.bottomY = Math.max(grp.bottomY, div.bottomY);
        grp.centerY = (grp.topY + grp.bottomY) / 2;
        grp.bandHeight = Math.max(0, grp.bottomY - grp.topY);
      }
    }

    const globalTierBands = Array.from(globalGroupsMap.values());

    return {
      coords,
      linePath,
      areaPath,
      divisionBands,
      globalTierBands,
      padLeft,
      padRight,
      padTop,
      padBottom,
      chartW,
      chartH,
      width,
      height,
    };
  }, [competitiveUpdates, chartDimensions, language]);

  // Agrupación dinámica de las partidas sincronizadas de Riot
  const matchGroups = useMemo(() => {
    if (!playerProfile || !playerProfile.matches || playerProfile.matches.length === 0) {
      return [];
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
                  Sin partidas recientes
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
                Sin agentes jugados en la temporada actual
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
              setHoveredDivision(null);
              setHoveredGlobalBandKey(null);
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

                  {/* Division Subtle Subdivisions & Interactive Hover Strips */}
                  {chartData.divisionBands.map((div) => {
                    const isDivHovered = hoveredDivision?.tierNum === div.tierNum;
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
                        {/* Interactive hoverable strip */}
                        <rect
                          x={chartData.padLeft}
                          y={div.topY}
                          width={chartData.chartW}
                          height={div.bandHeight}
                          fill={div.color}
                          fillOpacity={isDivHovered ? 0.12 : 0}
                          style={{ cursor: "pointer", transition: "fill-opacity 0.15s ease" }}
                          onMouseEnter={() => {
                            setHoveredDivision({
                              tierNum: div.tierNum,
                              exactName: div.exactName,
                              globalName: div.globalName,
                              color: div.color,
                              iconUrl: div.iconUrl,
                              centerY: div.centerY,
                              x: chartData.padLeft + 12,
                              y: div.centerY,
                            });
                          }}
                        />
                      </g>
                    );
                  })}

                  {/* Y-Axis Rank Badge Pills on Left Side */}
                  {chartData.globalTierBands.map((globalBand) => {
                    const activeDiv =
                      hoveredDivision &&
                      hoveredDivision.globalName.toLowerCase() === globalBand.globalName.toLowerCase()
                        ? hoveredDivision
                        : null;

                    const isHovered =
                      activeDiv !== null || hoveredGlobalBandKey === globalBand.globalName;

                    const displayExactName = activeDiv
                      ? activeDiv.exactName
                      : globalBand.divisions[globalBand.divisions.length - 1]?.exactName || globalBand.globalName;

                    const displayIcon = activeDiv
                      ? activeDiv.iconUrl
                      : isHovered
                      ? globalBand.divisions[globalBand.divisions.length - 1]?.iconUrl || globalBand.globalIconUrl
                      : globalBand.globalIconUrl;

                    const pillY = Math.max(
                      2,
                      Math.min(chartData.height - 24, (activeDiv ? activeDiv.centerY : globalBand.centerY) - 11)
                    );

                    return (
                      <g
                        key={globalBand.globalName}
                        transform={`translate(5, ${pillY})`}
                        style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
                        onMouseEnter={() => {
                          setHoveredGlobalBandKey(globalBand.globalName);
                          if (!hoveredDivision && globalBand.divisions.length > 0) {
                            const targetDiv = globalBand.divisions[globalBand.divisions.length - 1];
                            setHoveredDivision({
                              tierNum: targetDiv.tierNum,
                              exactName: targetDiv.exactName,
                              globalName: targetDiv.globalName,
                              color: targetDiv.color,
                              iconUrl: targetDiv.iconUrl,
                              centerY: targetDiv.centerY,
                              x: chartData.padLeft + 12,
                              y: targetDiv.centerY,
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredGlobalBandKey(null);
                          setHoveredDivision(null);
                        }}
                      >
                        {/* Sleek Pill Background */}
                        <rect
                          x={0}
                          y={0}
                          width={72}
                          height={22}
                          rx={6}
                          fill={isHovered ? "rgba(18, 25, 42, 0.95)" : "rgba(10, 15, 26, 0.85)"}
                          stroke={globalBand.color}
                          strokeWidth={isHovered ? 1.5 : 1}
                          strokeOpacity={isHovered ? 0.9 : 0.4}
                          filter={isHovered ? `drop-shadow(0 0 6px ${globalBand.color}66)` : undefined}
                        />
                        {/* Tier Icon */}
                        <image
                          href={displayIcon}
                          x={4}
                          y={3}
                          width={16}
                          height={16}
                          preserveAspectRatio="xMidYMid meet"
                        />
                        {/* Tier Name: Global (e.g. "ORO") or Exact on hover (e.g. "Oro II") */}
                        <text
                          x={23}
                          y={15}
                          fill={isHovered ? "#ffffff" : globalBand.color}
                          fontSize={isHovered ? "9" : "9.5"}
                          fontWeight="800"
                          fontFamily="'Inter', system-ui, sans-serif"
                          letterSpacing={isHovered ? "0.01em" : "0.03em"}
                        >
                          {isHovered ? displayExactName : globalBand.globalName.toUpperCase()}
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
                {/* Division Exact Rank Hover Indicator / Tooltip */}
                {hoveredDivision && !hoveredPoint && (
                  <div
                    className="lp-division-tooltip"
                    style={{
                      left: `${chartData.padLeft + 8}px`,
                      top: `${hoveredDivision.centerY}px`,
                    }}
                  >
                    <img
                      src={hoveredDivision.iconUrl}
                      alt={hoveredDivision.exactName}
                      className="lp-division-tooltip-icon"
                    />
                    <span
                      className="lp-division-tooltip-name"
                      style={{ color: hoveredDivision.color }}
                    >
                      {hoveredDivision.exactName}
                    </span>
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
                    { tierNum: 15, label: language === "es" ? "PLATINO" : "PLATINUM", color: "#06b6d4", topRatio: 0.08, heightRatio: 0.26 },
                    { tierNum: 12, label: language === "es" ? "ORO" : "GOLD", color: "#eab308", topRatio: 0.38, heightRatio: 0.26 },
                    { tierNum: 9, label: language === "es" ? "PLATA" : "SILVER", color: "#cbd5e1", topRatio: 0.68, heightRatio: 0.26 },
                  ].map((band, i) => (
                    <g key={i}>
                      <rect
                        x={82}
                        y={band.topRatio * chartDimensions.height}
                        width={Math.max(10, chartDimensions.width - 98)}
                        height={band.heightRatio * chartDimensions.height}
                        fill={band.color}
                        fillOpacity={0.04}
                      />
                      <line
                        x1={82}
                        y1={band.topRatio * chartDimensions.height}
                        x2={chartDimensions.width - 16}
                        y2={band.topRatio * chartDimensions.height}
                        stroke="rgba(255, 255, 255, 0.06)"
                        strokeDasharray="4 4"
                      />
                      {/* Sleek Pill Badge */}
                      <g transform={`translate(5, ${band.topRatio * chartDimensions.height + 6})`}>
                        <rect
                          x={0}
                          y={0}
                          width={72}
                          height={22}
                          rx={6}
                          fill="rgba(12, 17, 29, 0.75)"
                          stroke={band.color}
                          strokeWidth={1}
                          strokeOpacity={0.35}
                        />
                        <image
                          href={getBaseTierIconUrl(band.tierNum)}
                          x={4}
                          y={3}
                          width={16}
                          height={16}
                        />
                        <text
                          x={23}
                          y={15}
                          fill={band.color}
                          fontSize="9.5"
                          fontWeight="800"
                          fontFamily="'Inter', system-ui, sans-serif"
                        >
                          {band.label}
                        </text>
                      </g>
                    </g>
                  ))}
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
                    Sin partidas clasificatorias en los últimos 6 meses
                  </span>
                  <span className="lp-empty-subtitle">
                    Juega en modo Competitivo para registrar tu evolución de RR
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
              No se encontraron partidas en los últimos 6 meses en esta cuenta
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Juega partidas en Valorant para sincronizar tu historial y estadísticas en tiempo real.
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
