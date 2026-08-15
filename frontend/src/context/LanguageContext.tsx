"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  score: string;
  normal: string;
  competitive: string;
  endOfResults: string;
  draftScore: string;
  aiMacroScore: string;
}

const translations: Record<Language, Translations> = {
  es: {
    profile: "Perfil",
    draftCoach: "Entrenador de Draft",
    tacticalRadar: "Radar Táctico",
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
    duelists: "Duelistas",
    initiators: "Iniciadores",
    controllers: "Controladores",
    sentinels: "Centinelas",

    performanceSummary: "Resumen de Rendimiento",
    matchesCount: "Partidas",
    winRate: "Porcentaje de victorias",
    last10Matches: "Últimas 10 Partidas",
    rrGraphTitle: "Gráfico de RR en Clasificatoria",
    currentRank: "GOLD IV 23 RR",
    liveRadarTitle: "Radar Táctico en Vivo",
    clientDetectedText: "Cliente de Riot detectado. Buscando sala o selección de agentes...",
    clientOfflineText: "Cliente de Valorant no detectado. Abre el juego para activar el radar.",
    openSandbox: "ENTRENADOR DE DRAFT (SANDBOX)",
    launchOverlay: "LANZAR OVERLAY EN PARTIDA (HUD)",

    victory: "Victoria",
    defeat: "Derrota",
    score: "Score",
    normal: "Normal",
    competitive: "Competitivo",
    endOfResults: "Fin de los resultados",
    draftScore: "Puntuación de draft",
    aiMacroScore: "AI Macro Score",
  },
  en: {
    profile: "Profile",
    draftCoach: "Draft Coach",
    tacticalRadar: "Tactical Radar",
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

    soloRanked: "Competitive (Solo)",
    flexRanked: "Competitive (Flex)",
    unrated: "Unrated",
    swiftplay: "Swiftplay",

    allRoles: "All",
    duelists: "Duelists",
    initiators: "Initiators",
    controllers: "Controllers",
    sentinels: "Sentinels",

    performanceSummary: "Performance Overview",
    matchesCount: "Matches",
    winRate: "Win Rate",
    last10Matches: "Last 10 Matches",
    rrGraphTitle: "Competitive Rank Rating (RR) Chart",
    currentRank: "GOLD IV 23 RR",
    liveRadarTitle: "Live Tactical Radar",
    clientDetectedText: "Riot Client detected. Searching for match or agent draft...",
    clientOfflineText: "Valorant Client not detected. Launch game to activate radar.",
    openSandbox: "OPEN DRAFT COACH (SANDBOX)",
    launchOverlay: "LAUNCH IN-GAME OVERLAY (HUD)",

    victory: "Victory",
    defeat: "Defeat",
    score: "Score",
    normal: "Normal",
    competitive: "Competitive",
    endOfResults: "End of Results",
    draftScore: "Draft Rating",
    aiMacroScore: "AI Macro Score",
  },
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("es");

  useEffect(() => {
    const saved = localStorage.getItem("loadout_lang") as Language;
    if (saved === "es" || saved === "en") {
      setLanguage(saved);
    }
  }, []);

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
