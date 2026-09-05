/**
 * menuLogic.ts
 * ============
 * Funciones puras de cálculo, formateo y procesamiento de datos para la vista Menu/Profile.
 * Desacopla la matemática de curvas Bézier del gráfico competitivo y agregación de partidas de la UI.
 */

import { Agent } from "@/hooks/useValorantData";
import { SyncedCompetitiveUpdate, SyncedMatchItem } from "@/hooks/useGameState";
import { Translations } from "@/context/LanguageContext";
import {
  resolveTierName,
  getTierColor,
  getRankIconUrl,
  getGlobalTierName,
  getExactTierName,
  getBaseTierIconUrl,
} from "@/lib/rankUtils";

/**
 * Formatea el tiempo transcurrido (hace X min / Xm ago) con soporte multilingüe.
 */
export function formatTimeAgo(timeAgoStr: string, timestamp?: number, language: string = "es"): string {
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
}

/**
 * Traduce y formatea nombres de modos de juego.
 */
export function formatGameMode(modeName: string, language: string = "es"): string {
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
}

/**
 * Obtiene el icono del agente por su nombre con fallback a un UUID de agente.
 */
export function getAgentIconUrl(agents: Agent[], name: string, fallbackUuid: string): string {
  const found = agents.find((a) => a.displayName.toLowerCase() === name.toLowerCase());
  return (
    found?.displayIcon ||
    found?.bustPortrait ||
    `https://media.valorant-api.com/agents/${fallbackUuid}/displayicon.png`
  );
}

/**
 * Obtiene el icono del agente por UUID oficial.
 */
export function getAgentIconByIdUrl(agents: Agent[], uuid: string): string {
  if (!uuid) return "https://media.valorant-api.com/agents/add6443c-41c1-48b0-a04a-a71c8b3269a9/displayicon.png";
  const found = agents.find((a) => a.uuid.toLowerCase() === uuid.toLowerCase());
  return found?.displayIcon || found?.bustPortrait || "https://media.valorant-api.com/agents/add6443c-41c1-48b0-a04a-a71c8b3269a9/displayicon.png";
}

/**
 * Obtiene la imagen de la Player Card oficial del juego o fallback.
 */
export function getPlayerCardUrl(cardId?: string): string {
  if (!cardId) {
    return "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png";
  }
  return `https://media.valorant-api.com/playercards/${cardId}/smallart.png`;
}

export interface DivisionBand {
  tierNum: number;
  topY: number;
  bottomY: number;
  centerY: number;
  bandHeight: number;
  tierName: string;
  exactName: string;
  globalName: string;
  color: string;
  iconUrl: string;
  globalIconUrl: string;
  isBaseRank: boolean;
}

export interface GlobalTierBand {
  globalName: string;
  color: string;
  globalIconUrl: string;
  divisions: DivisionBand[];
  topY: number;
  bottomY: number;
  centerY: number;
  bandHeight: number;
}

export interface ChartCoordPoint {
  x: number;
  y: number;
  update: SyncedCompetitiveUpdate;
  color: string;
}

export interface CompetitiveChartData {
  coords: ChartCoordPoint[];
  linePath: string;
  areaPath: string;
  divisionBands: DivisionBand[];
  globalTierBands: GlobalTierBand[];
  padLeft: number;
  padRight: number;
  padTop: number;
  padBottom: number;
  chartW: number;
  chartH: number;
  width: number;
  height: number;
  rem: (v: number) => number;
}

/**
 * Algoritmo matemático para calcular las coordenadas, interpolación de spline cúbico de Bézier,
 * división de bloques simétricos de rangos y bandas del gráfico de MMR de Valorant.
 */
export function calculateCompetitiveChartData(params: {
  competitiveUpdates: SyncedCompetitiveUpdate[];
  chartDimensions: { width: number; height: number };
  language: string;
}): CompetitiveChartData | null {
  const { competitiveUpdates, chartDimensions, language } = params;
  if (competitiveUpdates.length === 0) return null;

  const rootFontSize =
    typeof window !== "undefined"
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16;
  const rem = (v: number) => v * rootFontSize;

  const padLeft = rem(7.5);   // ~120px en base 16px
  const padRight = rem(1.25); // ~20px
  const padTop = rem(0.875);  // ~14px
  const padBottom = rem(1);   // ~16px
  const width = chartDimensions.width;
  const height = chartDimensions.height;
  const chartW = Math.max(10, width - padLeft - padRight);
  const chartH = Math.max(10, height - padTop - padBottom);

  // Calcular MMR absoluto de cada punto: tier * 100 + rankedRating
  const tierValues = competitiveUpdates.map((u) => Math.max(3, u.tier));
  const minTier = Math.min(...tierValues);
  const maxTier = Math.max(...tierValues);

  // Garantizar que siempre hayan 4 bloques de rangos completos (simétricos y consistentes)
  const getBaseTierIndex = (tier: number) => (tier >= 27 ? 8 : Math.floor((tier - 3) / 3));
  let minBaseIdx = getBaseTierIndex(minTier);
  let maxBaseIdx = getBaseTierIndex(maxTier);

  while (maxBaseIdx - minBaseIdx < 3 && (minBaseIdx > 0 || maxBaseIdx < 8)) {
    if (minBaseIdx > 0) minBaseIdx--;
    if (maxBaseIdx - minBaseIdx < 3 && maxBaseIdx < 8) maxBaseIdx++;
  }

  const displayMinTier = minBaseIdx * 3 + 3;
  const displayMaxTier = maxBaseIdx >= 8 ? 27 : maxBaseIdx * 3 + 5;

  const yMin = displayMinTier * 100;
  const yMax = (displayMaxTier + 1) * 100;
  const mmrSpan = Math.max(100, yMax - yMin);

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padTop + chartH - ((clamped - yMin) / mmrSpan) * chartH;
  };

  // Coordenadas de los puntos exactas en px
  const count = competitiveUpdates.length;
  const coords: ChartCoordPoint[] = competitiveUpdates.map((update, i) => {
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

  // Generar curva suave (spline cúbico de Bézier)
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

  const divisionBands: DivisionBand[] = allDivisions.map((tNum) => {
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
  const globalGroupsMap = new Map<string, GlobalTierBand>();

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
    rem,
  };
}

export interface ProcessedMatchViewItem {
  id: string;
  isWin: boolean;
  agentName: string;
  agentIcon: string;
  metaText: string;
  mapName: string;
  placement: string;
  isMvp: boolean;
  scoreWon: number;
  scoreLost: number;
  badges: Array<{ label: string; type: string }>;
  kd: string;
  kda: string;
  dd: string;
  hs: string;
  acs: string;
}

export interface ProcessedMatchGroup {
  dateTitle: string;
  gameCount: number;
  wins: number;
  losses: number;
  dailyKd: string;
  dailyKdaLine: string;
  dailyKdaVal: string;
  dailyDd: string;
  dailyHs: string;
  dailyAcs: string;
  matches: ProcessedMatchViewItem[];
}

/**
 * Agrupa y procesa las partidas sincronizadas del jugador por fecha calculando
 * promedios diarios de ACS, K/D, Headshot % y Damage Delta.
 */
export function buildMatchGroups(params: {
  matches: Array<SyncedMatchItem & { dateTitle?: string; timeAgo?: string }> | undefined;
  agents: Agent[];
  language: string;
  t: Translations;
  defaultAvatar: string;
}): ProcessedMatchGroup[] {
  const { matches, agents, language, t, defaultAvatar } = params;
  if (!matches || matches.length === 0) {
    return [];
  }

  const groupMap: Record<string, Array<SyncedMatchItem & { dateTitle?: string; timeAgo?: string }>> = {};
  for (const m of matches) {
    const rawTitle = m.dateTitle || "";
    const d =
      !rawTitle ||
      rawTitle.toLowerCase() === "recientes" ||
      rawTitle.toLowerCase() === "recent"
        ? t.recents
        : rawTitle;
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
          metaText: `${formatTimeAgo(m.timeAgo || "", m.gameStartTime, language)} // ${formatGameMode(m.modeName, language)}`,
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
}
