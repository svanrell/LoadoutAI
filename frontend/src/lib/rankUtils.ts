export const TIER_NAMES_MAP: Record<number, string> = {
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

export const TIER_COLORS: Record<string, string> = {
  iron: "#a1a1aa",
  bronze: "#ca8a04",
  silver: "#cbd5e1",
  gold: "#eab308",
  platinum: "#06b6d4",
  diamond: "#c084fc",
  ascendant: "#10b981",
  immortal: "#f43f5e",
  radiant: "#fef08a",
  unranked: "#71717a",
};

export const TIER_BG_COLORS: Record<string, string> = {
  iron: "rgba(161, 161, 170, 0.08)",
  bronze: "rgba(202, 138, 4, 0.08)",
  silver: "rgba(203, 213, 225, 0.08)",
  gold: "rgba(234, 179, 8, 0.08)",
  platinum: "rgba(6, 182, 212, 0.08)",
  diamond: "rgba(192, 132, 252, 0.08)",
  ascendant: "rgba(16, 185, 129, 0.08)",
  immortal: "rgba(244, 63, 94, 0.08)",
  radiant: "rgba(254, 240, 138, 0.08)",
  unranked: "rgba(113, 113, 122, 0.05)",
};

export function resolveTierName(tier: number): string {
  return TIER_NAMES_MAP[tier] || "Unranked";
}

export function getGlobalTierName(tierNum: number, lang: "es" | "en" = "es"): string {
  if (tierNum <= 2) return lang === "es" ? "Sin rango" : "Unranked";
  if (tierNum === 27) return lang === "es" ? "Radiante" : "Radiant";

  const groupIdx = Math.floor((tierNum - 3) / 3);
  const namesEs = ["Hierro", "Bronce", "Plata", "Oro", "Platino", "Diamante", "Ascendente", "Inmortal"];
  const namesEn = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal"];

  if (groupIdx >= 0 && groupIdx < namesEs.length) {
    return lang === "es" ? namesEs[groupIdx] : namesEn[groupIdx];
  }
  return lang === "es" ? "Sin rango" : "Unranked";
}

export function getExactTierName(tierNum: number, lang: "es" | "en" = "es"): string {
  if (tierNum <= 2) return lang === "es" ? "Sin rango" : "Unranked";
  if (tierNum === 27) return lang === "es" ? "Radiante" : "Radiant";

  const groupName = getGlobalTierName(tierNum, lang);
  const divNum = ((tierNum - 3) % 3) + 1;
  const roman = divNum === 1 ? "I" : divNum === 2 ? "II" : "III";
  return `${groupName} ${roman}`;
}

export function getBaseTierIconUrl(tierNum: number): string {
  if (tierNum <= 2) return getRankIconUrl(0);
  if (tierNum === 27) return getRankIconUrl(27);
  const baseTierNum = Math.floor((tierNum - 3) / 3) * 3 + 3;
  return getRankIconUrl(baseTierNum);
}

export function getTierColor(tier: string | number): string {
  const name = typeof tier === "number" ? resolveTierName(tier) : tier || "";
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(TIER_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#06b6d4";
}

export function getTierBgColor(tier: string | number): string {
  const name = typeof tier === "number" ? resolveTierName(tier) : tier || "";
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(TIER_BG_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "rgba(6, 182, 212, 0.08)";
}

export function getRankIconUrl(tier: number): string {
  const safeTier = typeof tier === "number" && tier >= 0 && tier <= 27 ? tier : 0;
  return `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${safeTier}/smallicon.png`;
}

export function getRankLargeIconUrl(tier: number): string {
  const safeTier = typeof tier === "number" && tier >= 0 && tier <= 27 ? tier : 0;
  return `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${safeTier}/largeicon.png`;
}

export function getTierShortLabel(tierNum: number, tierName?: string): string {
  if (tierNum >= 3 && tierNum <= 5) return `I${tierNum - 2}`;
  if (tierNum >= 6 && tierNum <= 8) return `B${tierNum - 5}`;
  if (tierNum >= 9 && tierNum <= 11) return `S${tierNum - 8}`;
  if (tierNum >= 12 && tierNum <= 14) return `G${tierNum - 11}`;
  if (tierNum >= 15 && tierNum <= 17) return `P${tierNum - 14}`;
  if (tierNum >= 18 && tierNum <= 20) return `D${tierNum - 17}`;
  if (tierNum >= 21 && tierNum <= 23) return `A${tierNum - 20}`;
  if (tierNum >= 24 && tierNum <= 26) return `Imm${tierNum - 23}`;
  if (tierNum === 27) return "RAD";

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
  return "UNR";
}
