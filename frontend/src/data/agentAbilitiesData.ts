export interface AgentAbilityInfo {
  name: string;
  cost: number;
  isSignature?: boolean;
}

export interface AgentAbilityConfig {
  [abilityNameOrSlot: string]: number | { cost: number; isSignature?: boolean };
}

// Exact in-game ability costs for every Valorant agent
export const AGENT_ABILITY_PRICES: Record<string, Record<string, { cost: number; isSignature?: boolean }>> = {
  jett: {
    updraft: { cost: 150 },
    tailwind: { cost: 0, isSignature: true },
    cloudburst: { cost: 200 },
    ability1: { cost: 150 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 200 },
  },
  raze: {
    "blast pack": { cost: 200 },
    "paint shells": { cost: 0, isSignature: true },
    "boom bot": { cost: 300 },
    ability1: { cost: 200 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 300 },
  },
  reyna: {
    devour: { cost: 200 },
    dismiss: { cost: 200 },
    leer: { cost: 250 },
    ability1: { cost: 200 },
    ability2: { cost: 200, isSignature: true },
    grenade: { cost: 250 },
  },
  phoenix: {
    curveball: { cost: 250 },
    "hot hands": { cost: 0, isSignature: true },
    blaze: { cost: 150 },
    ability1: { cost: 250 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 150 },
  },
  yoru: {
    blindside: { cost: 250 },
    gatecrash: { cost: 0, isSignature: true },
    fakeout: { cost: 100 },
    ability1: { cost: 250 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 100 },
  },
  neon: {
    "relay bolt": { cost: 200 },
    "high gear": { cost: 0, isSignature: true },
    "fast lane": { cost: 300 },
    ability1: { cost: 200 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 300 },
  },
  iso: {
    undercut: { cost: 250 },
    "double tap": { cost: 150, isSignature: true },
    contingency: { cost: 200 },
    ability1: { cost: 250 },
    ability2: { cost: 150, isSignature: true },
    grenade: { cost: 200 },
  },
  sova: {
    "shock bolt": { cost: 150 },
    "recon bolt": { cost: 0, isSignature: true },
    "owl drone": { cost: 400 },
    ability1: { cost: 150 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 400 },
  },
  breach: {
    flashpoint: { cost: 250 },
    "fault line": { cost: 0, isSignature: true },
    aftershock: { cost: 200 },
    ability1: { cost: 250 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 200 },
  },
  skye: {
    trailblazer: { cost: 300 },
    "guiding light": { cost: 250, isSignature: true },
    regrowth: { cost: 150 },
    ability1: { cost: 300 },
    ability2: { cost: 250, isSignature: true },
    grenade: { cost: 150 },
  },
  "kay/o": {
    "flash/drive": { cost: 250 },
    "zero/point": { cost: 0, isSignature: true },
    "frag/ment": { cost: 200 },
    ability1: { cost: 250 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 200 },
  },
  fade: {
    seize: { cost: 200 },
    haunt: { cost: 0, isSignature: true },
    prowler: { cost: 250 },
    ability1: { cost: 200 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 250 },
  },
  gekko: {
    wingman: { cost: 300 },
    dizzy: { cost: 0, isSignature: true },
    "mosh pit": { cost: 250 },
    ability1: { cost: 300 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 250 },
  },
  omen: {
    paranoia: { cost: 300 },
    "dark cover": { cost: 0, isSignature: true },
    "shrouded step": { cost: 100 },
    ability1: { cost: 300 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 100 },
  },
  brimstone: {
    incendiary: { cost: 250 },
    "sky smoke": { cost: 100, isSignature: true },
    "stim beacon": { cost: 200 },
    ability1: { cost: 250 },
    ability2: { cost: 100, isSignature: true },
    grenade: { cost: 200 },
  },
  viper: {
    "poison cloud": { cost: 200 },
    "toxic screen": { cost: 0, isSignature: true },
    "snake bite": { cost: 200 },
    ability1: { cost: 200 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 200 },
  },
  astra: {
    "nova pulse": { cost: 150 },
    nebula: { cost: 150, isSignature: true },
    "gravity well": { cost: 150 },
    stars: { cost: 150 },
    ability1: { cost: 150 },
    ability2: { cost: 150, isSignature: true },
    grenade: { cost: 150 },
  },
  harbor: {
    cove: { cost: 350 },
    "high tide": { cost: 0, isSignature: true },
    cascade: { cost: 150 },
    ability1: { cost: 350 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 150 },
  },
  clove: {
    meddle: { cost: 250 },
    ruse: { cost: 0, isSignature: true },
    "pick-me-up": { cost: 100 },
    ability1: { cost: 250 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 100 },
  },
  killjoy: {
    alarmbot: { cost: 200 },
    turret: { cost: 0, isSignature: true },
    nanoswarm: { cost: 200 },
    ability1: { cost: 200 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 200 },
  },
  cypher: {
    "cyber cage": { cost: 100 },
    spycam: { cost: 0, isSignature: true },
    trapwire: { cost: 200 },
    ability1: { cost: 100 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 200 },
  },
  sage: {
    "slow orb": { cost: 200 },
    "healing orb": { cost: 0, isSignature: true },
    "barrier orb": { cost: 400 },
    ability1: { cost: 200 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 400 },
  },
  chamber: {
    headhunter: { cost: 150 },
    rendezvous: { cost: 0, isSignature: true },
    trademark: { cost: 200 },
    ability1: { cost: 150 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 200 },
  },
  deadlock: {
    "sonic sensor": { cost: 200 },
    "barrier mesh": { cost: 0, isSignature: true },
    gravnet: { cost: 200 },
    ability1: { cost: 200 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 200 },
  },
  vyse: {
    shear: { cost: 200 },
    "arc rose": { cost: 0, isSignature: true },
    razorvine: { cost: 150 },
    ability1: { cost: 200 },
    ability2: { cost: 0, isSignature: true },
    grenade: { cost: 150 },
  },
};

/**
 * Resolves the real-time cost and signature status for any agent ability.
 */
export function getAbilityPrice(
  agentName: string = "",
  abilityName: string = "",
  slot: string = "",
): { cost: number; isSignature: boolean } {
  const normAgent = agentName.trim().toLowerCase();
  const normAbility = abilityName.trim().toLowerCase();
  const normSlot = slot.trim().toLowerCase();

  const agentConfig = AGENT_ABILITY_PRICES[normAgent];
  if (agentConfig) {
    if (normAbility && agentConfig[normAbility]) {
      const entry = agentConfig[normAbility];
      return { cost: entry.cost, isSignature: Boolean(entry.isSignature) };
    }
    if (normSlot && agentConfig[normSlot]) {
      const entry = agentConfig[normSlot];
      return { cost: entry.cost, isSignature: Boolean(entry.isSignature) };
    }
  }

  // Universal fallbacks
  if (normSlot === "ability2" || normAbility.includes("signature")) {
    return { cost: 0, isSignature: true };
  }
  if (normSlot === "ability1") {
    return { cost: 200, isSignature: false };
  }
  if (normSlot === "grenade") {
    return { cost: 200, isSignature: false };
  }

  return { cost: 200, isSignature: false };
}
