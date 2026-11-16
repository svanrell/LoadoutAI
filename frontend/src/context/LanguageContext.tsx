"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "es" | "en";

export interface Translations {
  // Header
  profile: string;
  draftCoach: string;
  tacticalRadar: string;
  crosshairs: string;
  lineups: string;
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
  syncing: string;
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
  /** Texto cuando no hay perfil o rango (en lugar de un rango inventado) */
  noRankLabel: string;
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
  recents: string;
  noRecentMatches: string;
  noAgentsPlayedSeason: string;
  noCompetitiveMatches6Months: string;
  playCompetitiveToTrackRR: string;
  noMatchesFound6Months: string;
  playMatchesToSyncHistory: string;

  crosshairsDesc: string;
  lineupsDesc: string;
  backToProfile: string;

  // Lineups
  lineupsBadge: string;
  lineupsSearchPlaceholder: string;
  lineupsSideLabel: string;
  lineupsSiteLabel: string;
  lineupsMapLabel: string;
  lineupsAgentLabel: string;
  lineupsAll: string;
  lineupsAttack: string;
  lineupsDefense: string;
  /** {count} = número de lineups */
  lineupsShowingOne: string;
  lineupsShowingMany: string;
  lineupsClearFilters: string;
  lineupsEmptyTitle: string;
  lineupsComingSoonBadge: string;
  lineupsComingSoonTitle: string;
  lineupsComingSoonDesc: string;
  lineupsEmptyNoMatch: string;
  lineupsSite: string;
  lineupsDifficultyEasy: string;
  lineupsDifficultyMedium: string;
  lineupsDifficultyAdvanced: string;
  lineupsViewGuide: string;
  lineupsStandPosition: string;
  lineupsAimCue: string;
  lineupsTacticalImpact: string;
  lineupsClose: string;

  // Pregame & Draft Coach
  myTeamComposition: string;
  picked: string;
  selecting: string;
  you: string;
  ally: string;
  openStatus: string;
  lockedStatus: string;
  prepickStatus: string;
  fixed: string;
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
  winRateEstimated: string;
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
  teamStatus: string;
  selectionCompleted: string;
  draftFinished: string;
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
  abilitiesTitle: string;
  abilityFull: string;
  abilityFree: string;
  abilityPurchased: string;
  abilityNotPurchased: string;
  notDetectedDemo: string;

  // Tienda In-Game ({name} = arma o escudo)
  shopRoundInProgress: string;
  shopViewBuyMenuOffline: string;
  shopDefaultSidearmTitle: string;
  shopUnequipSidearmTitle: string;
  shopUnequipPrimaryTitle: string;
  shopEquipTitle: string;
  shopShields: string;
  shopUnequipShieldTitle: string;
  shopEquipShieldTitle: string;
  shopAgentNotDetectedTitle: string;
  shopPlayerFallback: string;
  shopShieldEquippedTitle: string;
  shopNoShieldTitle: string;
  shopSidearmTitle: string;
  shopPrimaryTitle: string;
  shopNoPrimaryTitle: string;
  shopPrimaryShort: string;
  shopToggleModeTitle: string;
  shopAiRecommendation: string;
  shopManualBuy: string;
  shopFollowing: string;
  shopEdit: string;
  shopAiPlan: string;
  shopSave: string;
  shopNoShield: string;
  shopEstimatedCost: string;
  shopBankCredits: string;
  shopSpend: string;
  shopRemaining: string;
  shopMinNextRound: string;
  shopIfYouWin: string;
  shopCatSidearms: string;
  shopCatSmgs: string;
  shopCatShotguns: string;
  shopCatRifles: string;
  shopCatSnipers: string;
  shopCatHeavy: string;
  shopWeaponFallback: string;
  shopPrimaryFire: string;
  shopFireModeAuto: string;
  shopFireModeSemiAuto: string;
  shopStatRunSpeed: string;
  shopStatEquip: string;
  shopStatReload: string;
  shopStatMagazine: string;
  shopUnitRounds: string;
  shopStatFireRate: string;
  shopUnitFireRate: string;
  shopStatAccuracy: string;
  shopUnitAccuracy: string;
  shopDamage: string;
  shopStatsUnavailable: string;
  shopHoverWeaponLine1: string;
  shopHoverWeaponLine2: string;

  // Pre-Game ({delta} = aporte en %)
  dismissError: string;
  synergyContributionTitle: string;
  onTeamBadge: string;
  clearSlotTitle: string;
  clearSlotHint: string;
  agentRoleFallback: string;

  // Menú: bandas de rango del gráfico vacío
  rankIconAlt: string;
  rankBandPlatinum: string;
  rankBandGold: string;
  rankBandSilver: string;
  rankBandBronze: string;

  // Miras
  crosshairCreatorTitle: string;
  crosshairCustomReticle: string;
  crosshairReset: string;
  crosshairRandom: string;
  crosshairCopyCode: string;
  crosshairCopied: string;
  crosshairResetShort: string;
  crosshairSave: string;
  crosshairSaved: string;
  crosshairSaveError: string;
  crosshairSavedTitle: string;
  crosshairSavedEmpty: string;
  crosshairLoad: string;
  crosshairDelete: string;
}

const translations: Record<Language, Translations> = {
  es: {
    profile: "Perfil",
    draftCoach: "Selección de Agente",
    tacticalRadar: "Selección de Armas",
    crosshairs: "Creador de Miras",
    lineups: "Lineups",
    map: "MAPA",
    mode: "MODO",
    patch: "Parche 9.04",
    freePlan: "Plan Gratuito",
    radarOnline: "Radar en Vivo",
    radarStandby: "Esperando",
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
    syncing: "Sincronizando...",
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
    noRankLabel: "SIN RANGO",
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
    recents: "Recientes",
    noRecentMatches: "Sin partidas recientes",
    noAgentsPlayedSeason: "Sin agentes jugados en la temporada actual",
    noCompetitiveMatches6Months: "Sin partidas clasificatorias en los últimos 6 meses",
    playCompetitiveToTrackRR: "Juega en modo Competitivo para registrar tu evolución de RR",
    noMatchesFound6Months: "No se encontraron partidas en los últimos 6 meses en esta cuenta",
    playMatchesToSyncHistory: "Juega partidas en Valorant para sincronizar tu historial y estadísticas en tiempo real.",

    crosshairsDesc: "Diseña, personaliza y genera códigos oficiales de miras de Valorant en tiempo real.",
    lineupsDesc: "Aprende y domina los mejores lineups tácticos de dardos, molotovs y humos por mapa.",
    lineupsBadge: "BÓVEDA TÁCTICA",
    lineupsSearchPlaceholder: "Buscar por flecha, post-plant, molly...",
    lineupsSideLabel: "BANDO:",
    lineupsSiteLabel: "ZONA:",
    lineupsMapLabel: "MAPA:",
    lineupsAgentLabel: "AGENTE:",
    lineupsAll: "TODOS",
    lineupsAttack: "ATAQUE",
    lineupsDefense: "DEFENSA",
    lineupsShowingOne: "Mostrando {count} lineup",
    lineupsShowingMany: "Mostrando {count} lineups",
    lineupsClearFilters: "LIMPIAR FILTROS ↺",
    lineupsEmptyTitle: "Sin lineups para mostrar",
    lineupsComingSoonBadge: "PRONTO",
    lineupsComingSoonTitle: "Próximamente",
    lineupsComingSoonDesc: "Estamos preparando la colección de lineups tácticos. Estará disponible pronto.",
    lineupsEmptyNoMatch: "Ningún lineup coincide con los filtros seleccionados.",
    lineupsSite: "ZONA",
    lineupsDifficultyEasy: "Fácil",
    lineupsDifficultyMedium: "Media",
    lineupsDifficultyAdvanced: "Avanzada",
    lineupsViewGuide: "VER GUÍA",
    lineupsStandPosition: "1. POSICIÓN INICIAL",
    lineupsAimCue: "2. REFERENCIA DE MIRA / HUD",
    lineupsTacticalImpact: "3. IMPACTO TÁCTICO",
    lineupsClose: "CERRAR",
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
    fixed: "FIJADO",
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
    estWinRate: "PORCENTAJE DE VICTORIA ESTIMADO",
    winRateEstimated: "PORCENTAJE DE VICTORIA ESTIMADO",
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
    teamStatus: "ESTADO DEL EQUIPO",
    selectionCompleted: "SELECCIÓN FINALIZADA",
    draftFinished: "DRAFT FINALIZADO",
    draftCompleted: "EQUIPO COMPLETO (5/5)",
    draftCompleteSubtitle: "Todos los agentes han sido seleccionados. La selección está cerrada.",
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
    abilitiesTitle: "HABILIDADES",
    abilityFull: "LLENA",
    abilityFree: "GRATIS",
    abilityPurchased: "COMPRADO",
    abilityNotPurchased: "NO COMPRADO",
    notDetectedDemo: "NO DETECTADO (DEMO JETT)",
    shopRoundInProgress: "Ronda en progreso...",
    shopViewBuyMenuOffline: "VER MENÚ DE COMPRA (OFFLINE)",
    shopDefaultSidearmTitle: "Pistola por defecto: {name}",
    shopUnequipSidearmTitle: "Click para desequipar (volver a Classic): {name}",
    shopUnequipPrimaryTitle: "Click para desequipar arma larga: {name}",
    shopEquipTitle: "Click para equipar: {name}",
    shopShields: "ESCUDOS",
    shopUnequipShieldTitle: "Click para desequipar: {name}",
    shopEquipShieldTitle: "Click para equipar (reemplaza cualquier otro escudo): {name}",
    shopAgentNotDetectedTitle: "Agente no detectado en vivo",
    shopPlayerFallback: "JUGADOR",
    shopShieldEquippedTitle: "Escudo equipado: {name}",
    shopNoShieldTitle: "Sin escudo equipado",
    shopSidearmTitle: "Pistola: {name}",
    shopPrimaryTitle: "Arma larga: {name}",
    shopNoPrimaryTitle: "Sin arma larga equipada",
    shopPrimaryShort: "ARMA LARGA",
    shopToggleModeTitle: "Click para alternar entre seguir la recomendación de la IA o compra manual",
    shopAiRecommendation: "RECOMENDACIÓN IA",
    shopManualBuy: "COMPRA MANUAL",
    shopFollowing: "SEGUIDA",
    shopEdit: "EDITAR",
    shopAiPlan: "Plan IA:",
    shopSave: "Ahorrar",
    shopNoShield: "Sin escudo",
    shopEstimatedCost: "Coste estimado:",
    shopBankCredits: "CRÉDITOS BANCO",
    shopSpend: "Gasto:",
    shopRemaining: "Restante:",
    shopMinNextRound: "MÍN. PRÓXIMA RONDA:",
    shopIfYouWin: "SI GANAS LA RONDA:",
    shopCatSidearms: "ARMAS DE MANO",
    shopCatSmgs: "SUBFUSILES",
    shopCatShotguns: "ESCOPETAS",
    shopCatRifles: "RIFLES",
    shopCatSnipers: "FUSILES DE FRANCOTIRADOR",
    shopCatHeavy: "AMETRALLADORAS",
    shopWeaponFallback: "ARMA",
    shopPrimaryFire: "DISPARO PRINCIPAL",
    shopFireModeAuto: "Automático",
    shopFireModeSemiAuto: "Semiautomático",
    shopStatRunSpeed: "VELOCIDAD",
    shopStatEquip: "EQUIPAR",
    shopStatReload: "RECARGA",
    shopStatMagazine: "CARGADOR",
    shopUnitRounds: "BALAS",
    shopStatFireRate: "CADENCIA",
    shopUnitFireRate: "B/S",
    shopStatAccuracy: "DISPERSIÓN",
    shopUnitAccuracy: "MIRA",
    shopDamage: "DAÑO",
    shopStatsUnavailable: "Estadísticas no disponibles",
    shopHoverWeaponLine1: "Pasa el ratón sobre un arma",
    shopHoverWeaponLine2: "para ver sus estadísticas",
    dismissError: "Cerrar aviso",
    synergyContributionTitle: "Aporte a la sinergia del equipo: {delta}%",
    onTeamBadge: "EQUIPO",
    clearSlotTitle: "Vaciar hueco",
    clearSlotHint: "Clic derecho o ✕ para vaciar el hueco",
    agentRoleFallback: "Agente",
    rankIconAlt: "Rango",
    rankBandPlatinum: "PLATINO",
    rankBandGold: "ORO",
    rankBandSilver: "PLATA",
    rankBandBronze: "BRONCE",
    crosshairCreatorTitle: "CREADOR DE MIRAS",
    crosshairCustomReticle: "RETÍCULA PERSONALIZADA",
    crosshairReset: "RESTABLECER",
    crosshairRandom: "Aleatoria",
    crosshairCopyCode: "Copiar código",
    crosshairCopied: "¡Copiado!",
    crosshairResetShort: "Restablecer",
    crosshairSave: "Guardar",
    crosshairSaved: "¡Guardada!",
    crosshairSaveError: "No se pudo guardar",
    crosshairSavedTitle: "MIRAS GUARDADAS",
    crosshairSavedEmpty: "Aún no has guardado ninguna mira. Pulsa Guardar para añadir la actual.",
    crosshairLoad: "Cargar",
    crosshairDelete: "Borrar",
  },
  en: {
    profile: "Profile",
    draftCoach: "Agent Selection",
    tacticalRadar: "Weapon Selection",
    crosshairs: "Crosshair Creator",
    lineups: "Lineups",
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
    syncing: "Syncing...",
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
    noRankLabel: "UNRANKED",
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
    recents: "Recent",
    noRecentMatches: "No recent matches",
    noAgentsPlayedSeason: "No agents played in the current season",
    noCompetitiveMatches6Months: "No competitive matches in the last 6 months",
    playCompetitiveToTrackRR: "Play in Competitive mode to track your RR progress",
    noMatchesFound6Months: "No matches found in the last 6 months on this account",
    playMatchesToSyncHistory: "Play matches in Valorant to synchronize your history and real-time stats.",

    crosshairsDesc: "Design, customize, and generate official Valorant crosshair codes in real time.",
    lineupsDesc: "Learn and master the best tactical recon, molly, and smoke lineups for each map.",
    lineupsBadge: "TACTICAL VAULT",
    lineupsSearchPlaceholder: "Search recon, post-plant, molly...",
    lineupsSideLabel: "SIDE:",
    lineupsSiteLabel: "SITE:",
    lineupsMapLabel: "MAP:",
    lineupsAgentLabel: "AGENT:",
    lineupsAll: "ALL",
    lineupsAttack: "ATTACK",
    lineupsDefense: "DEFENSE",
    lineupsShowingOne: "Showing {count} lineup",
    lineupsShowingMany: "Showing {count} lineups",
    lineupsClearFilters: "CLEAR FILTERS ↺",
    lineupsEmptyTitle: "No lineups to display",
    lineupsComingSoonBadge: "SOON",
    lineupsComingSoonTitle: "Coming soon",
    lineupsComingSoonDesc: "We are preparing the tactical lineup collection. It will be available soon.",
    lineupsEmptyNoMatch: "No lineups match the selected filters.",
    lineupsSite: "SITE",
    lineupsDifficultyEasy: "Easy",
    lineupsDifficultyMedium: "Medium",
    lineupsDifficultyAdvanced: "Advanced",
    lineupsViewGuide: "VIEW GUIDE",
    lineupsStandPosition: "1. STARTING POSITION",
    lineupsAimCue: "2. AIM / HUD REFERENCE",
    lineupsTacticalImpact: "3. TACTICAL IMPACT",
    lineupsClose: "CLOSE",
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
    fixed: "FIXED",
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
    estWinRate: "WIN RATE ESTIMATED",
    winRateEstimated: "WIN RATE ESTIMATED",
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
    teamStatus: "TEAM STATUS",
    selectionCompleted: "SELECTION COMPLETED",
    draftFinished: "DRAFT FINISHED",
    draftCompleted: "TEAM COMPLETE (5/5)",
    draftCompleteSubtitle: "All agents have been selected. Selection is closed.",
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
    abilitiesTitle: "ABILITIES",
    abilityFull: "FULL",
    abilityFree: "FREE",
    abilityPurchased: "PURCHASED",
    abilityNotPurchased: "NOT PURCHASED",
    notDetectedDemo: "NOT DETECTED (DEMO JETT)",
    shopRoundInProgress: "Round in progress...",
    shopViewBuyMenuOffline: "VIEW BUY MENU (OFFLINE)",
    shopDefaultSidearmTitle: "Default sidearm: {name}",
    shopUnequipSidearmTitle: "Click to unequip (back to Classic): {name}",
    shopUnequipPrimaryTitle: "Click to unequip primary weapon: {name}",
    shopEquipTitle: "Click to equip: {name}",
    shopShields: "SHIELDS",
    shopUnequipShieldTitle: "Click to unequip: {name}",
    shopEquipShieldTitle: "Click to equip (replaces any other shield): {name}",
    shopAgentNotDetectedTitle: "Agent not detected live",
    shopPlayerFallback: "PLAYER",
    shopShieldEquippedTitle: "Equipped shield: {name}",
    shopNoShieldTitle: "No shield equipped",
    shopSidearmTitle: "Sidearm: {name}",
    shopPrimaryTitle: "Primary weapon: {name}",
    shopNoPrimaryTitle: "No primary weapon equipped",
    shopPrimaryShort: "PRIMARY",
    shopToggleModeTitle: "Click to switch between following the AI recommendation and manual buy",
    shopAiRecommendation: "AI RECOMMENDATION",
    shopManualBuy: "MANUAL BUY",
    shopFollowing: "FOLLOWING",
    shopEdit: "EDIT",
    shopAiPlan: "AI plan:",
    shopSave: "Save",
    shopNoShield: "No shield",
    shopEstimatedCost: "Estimated cost:",
    shopBankCredits: "BANK CREDITS",
    shopSpend: "Spend:",
    shopRemaining: "Remaining:",
    shopMinNextRound: "MIN. NEXT ROUND:",
    shopIfYouWin: "IF YOU WIN THE ROUND:",
    shopCatSidearms: "SIDEARMS",
    shopCatSmgs: "SMGS",
    shopCatShotguns: "SHOTGUNS",
    shopCatRifles: "RIFLES",
    shopCatSnipers: "SNIPER RIFLES",
    shopCatHeavy: "MACHINE GUNS",
    shopWeaponFallback: "WEAPON",
    shopPrimaryFire: "PRIMARY FIRE",
    shopFireModeAuto: "Automatic",
    shopFireModeSemiAuto: "Semi-automatic",
    shopStatRunSpeed: "RUN SPEED",
    shopStatEquip: "EQUIP",
    shopStatReload: "RELOAD",
    shopStatMagazine: "MAGAZINE",
    shopUnitRounds: "ROUNDS",
    shopStatFireRate: "FIRE RATE",
    shopUnitFireRate: "RDS/S",
    shopStatAccuracy: "SPREAD",
    shopUnitAccuracy: "AIM",
    shopDamage: "DAMAGE",
    shopStatsUnavailable: "Stats not available",
    shopHoverWeaponLine1: "Hover over a weapon",
    shopHoverWeaponLine2: "to see its stats",
    dismissError: "Dismiss error",
    synergyContributionTitle: "Contribution to team synergy: {delta}%",
    onTeamBadge: "TEAM",
    clearSlotTitle: "Clear slot",
    clearSlotHint: "Right-click or ✕ to clear the slot",
    agentRoleFallback: "Agent",
    rankIconAlt: "Rank",
    rankBandPlatinum: "PLATINUM",
    rankBandGold: "GOLD",
    rankBandSilver: "SILVER",
    rankBandBronze: "BRONZE",
    crosshairCreatorTitle: "CROSSHAIR CREATOR",
    crosshairCustomReticle: "CUSTOM RETICLE",
    crosshairReset: "RESET",
    crosshairRandom: "Random",
    crosshairCopyCode: "Copy Code",
    crosshairCopied: "Copied!",
    crosshairResetShort: "Reset",
    crosshairSave: "Save",
    crosshairSaved: "Saved!",
    crosshairSaveError: "Could not save",
    crosshairSavedTitle: "SAVED CROSSHAIRS",
    crosshairSavedEmpty: "You have not saved any crosshair yet. Press Save to add the current one.",
    crosshairLoad: "Load",
    crosshairDelete: "Delete",
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
      try {
        const saved = localStorage.getItem("loadout_lang") as Language;
        if (saved === "es" || saved === "en") {
          return saved;
        }
      } catch {
        // Ignore if localStorage is unavailable
      }
    }
    return "es";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem("loadout_lang", lang);
    } catch {
      // Ignore
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
