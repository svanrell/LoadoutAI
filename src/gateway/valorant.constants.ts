// ============================================================================
// CONSTANTES Y UTILIDADES COMPARTIDAS DE VALORANT
// ============================================================================

export const MAPS_MAP: Record<string, string> = {
  // Mapas Estándar
  "/Game/Maps/Ascent/Ascent": "Ascent",
  "/Game/Maps/Bonsai/Bonsai": "Split",
  "/Game/Maps/Canyon/Canyon": "Fracture",
  "/Game/Maps/Duality/Duality": "Bind",
  "/Game/Maps/Foxtrot/Foxtrot": "Breeze",
  "/Game/Maps/Jam/Jam": "Lotus",
  "/Game/Maps/Infinity/Infinity": "Abyss",
  "/Game/Maps/Jamboree/Jamboree": "Abyss",
  "/Game/Maps/Pitt/Pitt": "Pearl",
  "/Game/Maps/Port/Port": "Icebox",
  "/Game/Maps/Juliett/Juliett": "Sunset",
  "/Game/Maps/Rook/Rook": "Corrode",
  "/Game/Maps/Triad/Triad": "Haven",
  "/Game/Maps/Plummet/Plummet": "Summit",
  // Mapas Team Deathmatch (HURM)
  "/Game/Maps/Kasbah/Kasbah": "Kasbah",
  "/Game/Maps/HURM/HURM_Bowl/HURM_Bowl": "Kasbah",
  "/Game/Maps/Piazza/Piazza": "Piazza",
  "/Game/Maps/HURM/HURM_Yard/HURM_Yard": "Piazza",
  "/Game/Maps/District/District": "District",
  "/Game/Maps/HURM/HURM_Alley/HURM_Alley": "District",
  "/Game/Maps/Drift/Drift": "Drift",
  "/Game/Maps/HURM/HURM_Helix/HURM_Helix": "Drift",
  "/Game/Maps/HURM/HURM_HighTide/HURM_HighTide": "Glitch",
  // Campo de tiro / The Range
  "/Game/Maps/Poveglia/Range": "The Range",
  "/Game/Maps/PovegliaV2/RangeV2": "The Range",
};

export const QUEUES_MAP: Record<string, string> = {
  unrated: "Unrated",
  competitive: "Competitive",
  swiftplay: "Swiftplay",
  spikerush: "Spike Rush",
  deathmatch: "Deathmatch",
  hurm: "Team Deathmatch",
  ggteam: "Escalation",
  onefa: "Replication",
  snowball: "Snowball Fight",
  newmap: "New Map",
  premier: "Premier",
  "premier-tournament": "Premier Tournament",
  seeding: "Seeding",
  custom: "Custom Game",
};

export const TIER_NAMES: Record<number, string> = {
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

export function resolveMapName(mapPath: string): string {
  if (!mapPath) return "Ascent";
  if (MAPS_MAP[mapPath]) return MAPS_MAP[mapPath];

  const lower = mapPath.toLowerCase();
  for (const [key, name] of Object.entries(MAPS_MAP)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return name;
    }
  }

  const parts = mapPath.split("/").filter(Boolean);
  const lastPart = parts.length > 0 ? parts[parts.length - 1] : "Ascent";
  const reconstructed = `/Game/Maps/${lastPart}/${lastPart}`;
  if (MAPS_MAP[reconstructed]) return MAPS_MAP[reconstructed];

  return lastPart;
}

export function resolveQueueName(
  queueId?: string,
  gameMode?: string,
  isRanked?: boolean,
  roundsWonMax?: number,
  provisioningFlowId?: string,
  customGameName?: string,
  isCustomGame?: boolean,
): string {
  const q = (queueId || "").trim().toLowerCase();
  const gm = (gameMode || "").trim().toLowerCase();
  const flow = (provisioningFlowId || "").trim().toLowerCase();

  // Detección explícita de partidas personalizadas (Custom Game)
  if (
    isCustomGame === true ||
    flow.includes("custom") ||
    (customGameName && customGameName.trim().length > 0) ||
    q === "custom" ||
    q.includes("custom") ||
    gm.includes("custom")
  ) {
    return "Custom Game";
  }

  // Detección por ID de cola o nombre de modo
  if (q === "swiftplay" || gm.includes("swiftplay") || gm.includes("swift")) {
    return "Swiftplay";
  }
  if (q === "spikerush" || gm.includes("quickbomb") || gm.includes("spike")) {
    return "Spike Rush";
  }
  if (q === "deathmatch" || gm.includes("deathmatch") || gm.includes("dm")) {
    return "Deathmatch";
  }
  if (q === "hurm" || gm.includes("hurm") || gm.includes("teamdeathmatch")) {
    return "Team Deathmatch";
  }
  if (q === "ggteam" || gm.includes("ggteam") || gm.includes("escalation")) {
    return "Escalation";
  }
  if (q === "onefa" || gm.includes("onefa") || gm.includes("replication")) {
    return "Replication";
  }
  if (q === "snowball" || gm.includes("snowball")) {
    return "Snowball Fight";
  }
  if (q === "premier" || gm.includes("premier") || q.includes("premier")) {
    return "Premier";
  }
  if (q === "competitive" || gm.includes("competitive") || isRanked === true) {
    return "Competitive";
  }
  if (q === "unrated" || gm.includes("unrated")) {
    return "Unrated";
  }

  if (q && QUEUES_MAP[q]) {
    return QUEUES_MAP[q];
  }

  if (q) {
    return q
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return isRanked ? "Competitive" : "Custom Game";
}

export function resolveTierName(tier: number): string {
  return TIER_NAMES[tier] || "Unranked";
}
