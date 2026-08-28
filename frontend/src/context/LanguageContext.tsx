"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "es" | "en";

export interface Translations {
  // Header
  profile: string;
  draftCoach: string;
  tacticalRadar: string;
  tierList: string;
  tools: string;
  map: string;
  mode: string;
  patch: string;
  freePlan: string;
  radarOnline: string;
  radarStandby: string;
  radarOffline: string;

  // Sub Nav
  matchHistory: string;
  accountStats: string;
  agentStats: string;

  // Search & Filters
  region: string;
  playerName: string;
  tag: string;
  reset: string;
  search: string;
  refresh: string;
  filterAgents: string;

  // Modes
  soloRanked: string;
  flexRanked: string;
  unrated: string;
  swiftplay: string;

  // Roles
  allRoles: string;
  duelists: string;
  initiators: string;
  controllers: string;
  sentinels: string;

  // Stats
  performanceSummary: string;
  matchesCount: string;
  winRate: string;
  last10Matches: string;
  rrGraphTitle: string;
  currentRank: string;
  liveRadarTitle: string;
  clientDetectedText: string;
  clientOfflineText: string;
  openSandbox: string;
  launchOverlay: string;

  // Match History & Tracker
  victory: string;
  defeat: string;
  matchMvp: string;
  teamMvp: string;
  draw: string;
  score: string;
  normal: string;
  competitive: string;
  endOfResults: string;
  draftScore: string;
  aiMacroScore: string;
  winsShort: string;
  lossesShort: string;
  unrankedLabel: string;

  inDevelopment: string;
  inDevelopmentDesc: string;
  tierListDesc: string;
  toolsDesc: string;
  backToProfile: string;

  // Pregame & Draft Coach
  myTeamComposition: string;
  picked: string;
  selecting: string;
  you: string;
  ally: string;
  openStatus: string;
  lockedStatus: string;
  prepickStatus: string;
  lvl: string;
  modeSpecs: string;
  teamCapacity: string;
  playersCount: string;
  economyRules: string;
  buyAllowed: string;
  teamSynergyAnalyzer: string;
  metaComposition: string;
  balancedComposition: string;
  averageComposition: string;
  highRiskComposition: string;
  picksLocked: string;
  of5Agents: string;
  aiStatus: string;
  fullCompAnalyzed: string;
  evaluatingSynergies: string;
  aiDraftCoach: string;
  top5PicksGlobal: string;
  waitingDraftPicks: string;
  estWinRate: string;
  roleSynergyExplorer: string;
  allAgentsSortedWinRate: string;
  available: string;
  roster: string;
  lock: string;
  pick: string;
  selectHeroAgent: string;
  loadingAgents: string;
  noCharacterSelected: string;
  selectAgent: string;
  classRole: string;
  lockAgentBtn: string;
  draftCompleted: string;
  draftCompleteSubtitle: string;
  tacticalOverview: string;
  tacticalStrengths: string;
  tacticalPlaystyle: string;
  rolesDistribution: string;
  goToWeaponShop: string;
  scoreLabel: string;
  scoreGradeRadiantCore: string;
  scoreGradeTacticalMastery: string;
  scoreGradeOptimized: string;
  scoreGradeStandard: string;
  scoreGradeDeficit: string;
  scoreGradeBreakdown: string;
}

const translations: Record<Language, Translations> = {
  es: {
    profile: "Perfil",
    draftCoach: "Selección de Agente",
    tacticalRadar: "Selección de Armas",
    tierList: "Tier List",
    tools: "Herramientas",
    map: "MAPA",
    mode: "MODO",
    patch: "Parche 9.04",
    freePlan: "Plan Gratuito",
    radarOnline: "Radar en Vivo",
    radarStandby: "Standby",
    radarOffline: "Desconectado",

    matchHistory: "Historial de partidas",
    accountStats: "Estadísticas de la cuenta",
    agentStats: "Estadísticas del agente",

    region: "Región",
    playerName: "Nombre de jugador",
    tag: "Etiqueta",
    reset: "Restablecer",
    search: "Buscar",
    refresh: "Actualizar",
    filterAgents: "Filtrar Agentes",

    soloRanked: "Clasificatoria en Solitario",
    flexRanked: "Clasificatoria Flexible",
    unrated: "Reclutamiento",
    swiftplay: "Swiftplay",

    allRoles: "Todos",
    duelists: "Duelista",
    initiators: "Iniciador",
    controllers: "Control",
    sentinels: "Centinela",

    performanceSummary: "Resumen de Rendimiento",
    matchesCount: "Partidas",
    winRate: "Porcentaje de victorias",
    last10Matches: "Últimas 10 Partidas",
    rrGraphTitle: "Gráfico de RR en Clasificatoria",
    currentRank: "GOLD IV 23 RR",
    liveRadarTitle: "Radar de Partida en Vivo",
    clientDetectedText: "Cliente de Riot detectado. Buscando sala o selección de agentes...",
    clientOfflineText: "Cliente de Valorant no detectado. Abre el juego para activar el radar.",
    openSandbox: "SELECCIÓN DE AGENTE (SANDBOX)",
    launchOverlay: "SELECCIÓN DE ARMAS (HUD)",

    victory: "Victoria",
    defeat: "Derrota",
    matchMvp: "MVP Partida",
    teamMvp: "MVP Equipo",
    draw: "Empate",
    score: "SCORE",
    normal: "Normal",
    competitive: "Competitivo",
    endOfResults: "Fin de los resultados",
    draftScore: "Puntuación de draft",
    aiMacroScore: "AI Macro Score",
    winsShort: "V",
    lossesShort: "D",
    unrankedLabel: "Sin clasificar",

    inDevelopment: "Módulo en Desarrollo",
    inDevelopmentDesc: "Esta funcionalidad está siendo desarrollada e integrada con los modelos de IA y la API de Valorant. Estará disponible próximamente.",
    tierListDesc: "Tier list automática de agentes, winrates por mapa y combinaciones óptimas en el parche actual.",
    toolsDesc: "Calculadora de economía táctica, visualizador de lineups y simulador de rondas de pistolas.",
    backToProfile: "VOLVER AL PERFIL",

    // Pregame
    myTeamComposition: "Composición del Equipo",
    picked: "Elegidos",
    selecting: "Seleccionando...",
    you: "Tú",
    ally: "Aliado",
    openStatus: "LIBRE",
    lockedStatus: "FIJADO",
    prepickStatus: "PRE-PICK",
    lvl: "NIVEL",
    modeSpecs: "Especificaciones del Modo",
    teamCapacity: "Capacidad de Equipo:",
    playersCount: "Jugadores",
    economyRules: "Reglas de Economía:",
    buyAllowed: "Compras Permitidas",
    teamSynergyAnalyzer: "Analizador de Sinergia",
    metaComposition: "COMPOSICIÓN META",
    balancedComposition: "COMPOSICIÓN BALANCEADA",
    averageComposition: "COMPOSICIÓN PROMEDIO",
    highRiskComposition: "COMPOSICIÓN DE RIESGO",
    picksLocked: "Bloqueados",
    of5Agents: "de 5 Agentes",
    aiStatus: "Estado IA",
    fullCompAnalyzed: "Composición completa analizada.",
    evaluatingSynergies: "Evaluando mejores sinergias...",
    aiDraftCoach: "Selección de Agentes IA",
    top5PicksGlobal: "Top 5 Picks (Global)",
    waitingDraftPicks: "Esperando selección de agentes...",
    estWinRate: "WR EST.",
    roleSynergyExplorer: "Explorador de Sinergias",
    allAgentsSortedWinRate: "Todos los Agentes por Win Rate",
    available: "Disponibles",
    roster: "Plantel",
    lock: "Fijar",
    pick: "Elegir",
    selectHeroAgent: "Selecciona tu Agente",
    loadingAgents: "Cargando agentes...",
    noCharacterSelected: "Ningún personaje seleccionado",
    selectAgent: "SELECCIONAR AGENTE",
    classRole: "CLASE",
    lockAgentBtn: "FIJAR AGENTE",
    draftCompleted: "Equipo Completo (5/5)",
    draftCompleteSubtitle: "Todos los personajes han sido elegidos",
    tacticalOverview: "Análisis Táctico de la Composición",
    tacticalStrengths: "Puntos Fuertes del Equipo",
    tacticalPlaystyle: "Estrategia Recomendada",
    rolesDistribution: "Distribución de Roles",
    goToWeaponShop: "IR A SELECCIÓN DE ARMAS",
    scoreLabel: "PUNTUACIÓN",
    scoreGradeRadiantCore: "Núcleo Radiante",
    scoreGradeTacticalMastery: "Dominio Táctico",
    scoreGradeOptimized: "Optimizado",
    scoreGradeStandard: "Estándar",
    scoreGradeDeficit: "Déficit Táctico",
    scoreGradeBreakdown: "Desbalance",
  },
  en: {
    profile: "Profile",
    draftCoach: "Agent Selection",
    tacticalRadar: "Weapon Selection",
    tierList: "Tier List",
    tools: "Tools",
    map: "MAP",
    mode: "MODE",
    patch: "Patch 9.04",
    freePlan: "Free Plan",
    radarOnline: "Radar Live",
    radarStandby: "Standby",
    radarOffline: "Offline",

    matchHistory: "Match History",
    accountStats: "Account Stats",
    agentStats: "Agent Stats",

    region: "Region",
    playerName: "Player Name",
    tag: "Tag",
    reset: "Reset",
    search: "Search",
    refresh: "Refresh",
    filterAgents: "Filter Agents",

    soloRanked: "Solo Ranked",
    flexRanked: "Flex Ranked",
    unrated: "Unrated",
    swiftplay: "Swiftplay",

    allRoles: "All Roles",
    duelists: "Duelist",
    initiators: "Initiator",
    controllers: "Controller",
    sentinels: "Sentinel",

    performanceSummary: "Performance Summary",
    matchesCount: "Matches",
    winRate: "Win Rate",
    last10Matches: "Last 10 Matches",
    rrGraphTitle: "Competitive RR Chart",
    currentRank: "GOLD IV 23 RR",
    liveRadarTitle: "Live Match Radar",
    clientDetectedText: "Riot Client detected. Searching for match or agent draft...",
    clientOfflineText: "Valorant Client not detected. Launch game to activate radar.",
    openSandbox: "AGENT SELECTION (SANDBOX)",
    launchOverlay: "WEAPON SELECTION (HUD)",

    victory: "Victory",
    defeat: "Defeat",
    matchMvp: "Match MVP",
    teamMvp: "Team MVP",
    draw: "Draw",
    score: "SCORE",
    normal: "Normal",
    competitive: "Competitive",
    endOfResults: "End of Results",
    draftScore: "Draft Rating",
    aiMacroScore: "AI Macro Score",
    winsShort: "W",
    lossesShort: "L",
    unrankedLabel: "Unranked",

    inDevelopment: "Module In Development",
    inDevelopmentDesc: "This feature is currently under development and being integrated with our AI models and the Valorant API. It will be available soon.",
    tierListDesc: "Automated agent tier lists, win rates per map, and optimal team compositions for the current patch.",
    toolsDesc: "Tactical economy calculator, lineup visualizer, and pistol round simulators.",
    backToProfile: "BACK TO PROFILE",

    // Pregame
    myTeamComposition: "My Team Composition",
    picked: "Picked",
    selecting: "Selecting...",
    you: "You",
    ally: "Ally",
    openStatus: "OPEN",
    lockedStatus: "LOCKED",
    prepickStatus: "PRE-PICK",
    lvl: "LVL",
    modeSpecs: "Mode Specifications",
    teamCapacity: "Team Capacity:",
    playersCount: "Players",
    economyRules: "Economy Rules:",
    buyAllowed: "Buy Allowed",
    teamSynergyAnalyzer: "Team Synergy Analyzer",
    metaComposition: "META COMPOSITION",
    balancedComposition: "BALANCED COMPOSITION",
    averageComposition: "AVERAGE COMPOSITION",
    highRiskComposition: "HIGH RISK COMPOSITION",
    picksLocked: "Picks Locked",
    of5Agents: "of 5 Agents",
    aiStatus: "AI Status",
    fullCompAnalyzed: "Full composition analyzed.",
    evaluatingSynergies: "Evaluating best candidate synergies...",
    aiDraftCoach: "AI Agent Selection",
    top5PicksGlobal: "Top 5 Picks (Global)",
    waitingDraftPicks: "Waiting for pregame draft picks...",
    estWinRate: "EST. WR",
    roleSynergyExplorer: "Role Synergy Explorer",
    allAgentsSortedWinRate: "All Agents Sorted by Win Rate",
    available: "Available",
    roster: "Roster",
    lock: "Lock",
    pick: "Pick",
    selectHeroAgent: "Select Hero Agent",
    loadingAgents: "Loading agents...",
    noCharacterSelected: "No Character\nSelected",
    selectAgent: "Select Agent",
    classRole: "Class Role",
    lockAgentBtn: "Lock Agent",
    draftCompleted: "Team Complete (5/5)",
    draftCompleteSubtitle: "All characters have been selected",
    tacticalOverview: "Tactical Composition Overview",
    tacticalStrengths: "Team Strengths",
    tacticalPlaystyle: "Recommended Strategy",
    rolesDistribution: "Role Distribution",
    goToWeaponShop: "GO TO WEAPON SELECTION",
    scoreLabel: "SCORE",
    scoreGradeRadiantCore: "Radiant Core",
    scoreGradeTacticalMastery: "Tactical Mastery",
    scoreGradeOptimized: "Optimized",
    scoreGradeStandard: "Standard",
    scoreGradeDeficit: "Deficit",
    scoreGradeBreakdown: "Breakdown",
  },
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("loadout_lang") as Language;
      if (saved === "es" || saved === "en") {
        return saved;
      }
    }
    return "es";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("loadout_lang", lang);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
