"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { advanceRoundEconomy, getResetCreditsForRound, RoundOutcome } from "@/data/economyEngine";

export type ViewState = "closed" | "menu" | "pregame" | "ingame" | "tierlist" | "tools";

export interface Player {
  puuid: string;
  name: string;
  agentId: string | null;
  state: string; // "", "selected", "locked"
  level: number;
  rank: number;
  playerCardId: string;
}

export interface BuyRecommendation {
  weapon: string;
  shield: string;
  abilities: boolean;
  cost: number;
  tactic: string;
  site: string;
  defensor: string;
}

export interface EnemyEconomy {
  avg_credits: number;
  weapon: string;
  shield: string;
  type: string;
}

export interface MLDraftRecommendation {
  agent: string;
  displayName: string;
  uuid: string;
  winRate: number;
}

export interface MLAgentImpact {
  agent: string;
  displayName: string;
  uuid: string;
  role?: string;
  impactDelta: number;
  synergyWithout?: number;
}

export interface SyncedMatchItem {
  id: string;
  isWin: boolean;
  agentId: string;
  mapName: string;
  modeName: string;
  placement: string;
  isMvp: boolean;
  scoreWon: number;
  scoreLost: number;
  kd: string;
  kda: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  hsPercent: number;
  damageDelta: number;
  gameStartTime: number;
  dateTitle: string;
  timeAgo: string;
}

export interface SyncedAgentStat {
  agentId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface SyncedCompetitiveUpdate {
  matchId: string;
  mapName: string;
  matchStartTime: number;
  tier: number;
  tierName: string;
  rankedRating: number;
  rankedRatingEarned: number;
  performanceBonus: number;
  movement: string;
  dateStr: string;
  timeAgo: string;
}

export interface SyncedPlayerProfile {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
  currentTier: number;
  rankName: string;
  rankedRating: number;
  leaderboardRank: number;
  playerCardId?: string;
  accountLevel?: number;
  totalMatches: number;
  winRate: number;
  streak: Array<"W" | "L">;
  topAgents: SyncedAgentStat[];
  matches: SyncedMatchItem[];
  competitiveUpdates?: SyncedCompetitiveUpdate[];
}

interface GameStateContextProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  selectedMap: string;
  setSelectedMap: (map: string) => void;
  selectedMode: string;
  setSelectedMode: (mode: string) => void;
  isLiveMode: boolean;
  setIsLiveMode: (live: boolean) => void;     
  connectionStatus: "offline" | "menu-mode" | "live";
  connectionText: string;
  myTeam: Player[];
  mlRecommendations: MLDraftRecommendation[];
  mlSynergyWinRate: number;
  mlAgentImpacts: MLAgentImpact[];
  currentIngameRound: number;
  buyPhaseAvailable: boolean;
  buyPhaseTime: number;
  buyRecommendations: BuyRecommendation | null;
  enemyEconomy: EnemyEconomy | null;
  myCredits: number;
  setMyCredits: (credits: number) => void;
  scoreAlly: number;
  scoreEnemy: number;
  lossStreak: number;
  isFollowingAiRecommendation: boolean;
  setIsFollowingAiRecommendation: (following: boolean) => void;
  plannedSpend: number;
  setPlannedSpend: (spend: number) => void;
  pregameMatchId: string | null;
  selectAgent: (agentUuid: string) => void;
  lockAgent: (agentUuid: string) => void;
  requestMlDraft: (mapName?: string, allies?: string[]) => void;
  playerProfile: SyncedPlayerProfile | null;
  isProfileLoading: boolean;
  requestPlayerProfile: (puuid?: string, forceRefresh?: boolean) => void;
}

const GameStateContext = createContext<GameStateContextProps | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewState>("closed");
  const [selectedMap, setSelectedMap] = useState("Ascent");
  const [selectedMode, setSelectedMode] = useState("competitive");
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  const [connectionStatus, setConnectionStatus] = useState<"offline" | "menu-mode" | "live">("offline");
  const [connectionText, setConnectionText] = useState("Radar Offline");
  const [myTeam, setMyTeam] = useState<Player[]>(
    Array(5).fill(null).map((_, i) => ({
      puuid: `p${i}`, name: i === 0 ? "You" : `Ally ${i+1}`, agentId: null, state: "", level: 0, rank: 0, playerCardId: ""
    }))
  );
  
  const [mlRecommendations, setMlRecommendations] = useState<MLDraftRecommendation[]>([]);
  const [mlSynergyWinRate, setMlSynergyWinRate] = useState<number>(50.0);
  const [mlAgentImpacts, setMlAgentImpacts] = useState<MLAgentImpact[]>([]);
  const [currentIngameRound, setCurrentIngameRound] = useState(1);
  const [buyPhaseAvailable, setBuyPhaseAvailable] = useState(false);
  const [buyPhaseTime, setBuyPhaseTime] = useState(0);
  const [buyRecommendations, setBuyRecommendations] = useState<BuyRecommendation | null>(null);
  const [enemyEconomy, setEnemyEconomy] = useState<EnemyEconomy | null>(null);
  const [myCredits, setMyCredits] = useState(800); // 800 créditos iniciales oficiales
  const [scoreAlly, setScoreAlly] = useState(0);
  const [scoreEnemy, setScoreEnemy] = useState(0);
  const [lossStreak, setLossStreak] = useState(0);
  const [isFollowingAiRecommendation, setIsFollowingAiRecommendation] = useState(true);
  const [plannedSpend, setPlannedSpend] = useState(0);
  const [pregameMatchId, setPregameMatchId] = useState<string | null>(null);

  const creditsRef = useRef(myCredits);
  creditsRef.current = myCredits;
  const currentRoundRef = useRef(currentIngameRound);
  currentRoundRef.current = currentIngameRound;
  const scoreAllyRef = useRef(scoreAlly);
  scoreAllyRef.current = scoreAlly;
  const scoreEnemyRef = useRef(scoreEnemy);
  scoreEnemyRef.current = scoreEnemy;
  const lossStreakRef = useRef(lossStreak);
  lossStreakRef.current = lossStreak;
  const plannedSpendRef = useRef(plannedSpend);
  plannedSpendRef.current = plannedSpend;

  const [playerProfile, setPlayerProfile] = useState<SyncedPlayerProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const lastProfileFetchRef = useRef<number>(0);

  const requestPlayerProfile = (puuid?: string, forceRefresh = false) => {
    if (socketRef.current) {
      const now = Date.now();
      if (!forceRefresh && now - lastProfileFetchRef.current < 3000) {
        return;
      }
      lastProfileFetchRef.current = now;
      setIsProfileLoading(true);
      socketRef.current.emit("request_player_profile", { puuid, forceRefresh });
    }
  };

  const requestMlDraft = (mapName?: string, allies?: string[]) => {
    if (socketRef.current) {
      const map = mapName || selectedMap || "Ascent";
      const picked = allies || myTeam.map((p) => p.agentId).filter((id): id is string => Boolean(id));
      socketRef.current.emit("request_ml_draft", { mapName: map, allies: picked });
    }
  };

  const selectAgent = (agentUuid: string) => {
    if (socketRef.current) {
      socketRef.current.emit("pregame_select", { pregameMatchId, agentUuid });
    }
    if (!isLiveMode) {
      // En modo simulador / offline: actualizar el equipo localmente y recalcular ML
      setMyTeam((prevTeam) => {
        const teamCopy = [...prevTeam];
        const existingIndex = teamCopy.findIndex((p) => p.agentId?.toLowerCase() === agentUuid.toLowerCase());
        if (existingIndex !== -1) {
          // Si ya estaba seleccionado, deseleccionar
          teamCopy[existingIndex] = { ...teamCopy[existingIndex], agentId: null, state: "" };
        } else {
          // Asignar al primer slot libre
          const freeSlot = teamCopy.findIndex((p) => !p.agentId);
          if (freeSlot !== -1) {
            teamCopy[freeSlot] = { ...teamCopy[freeSlot], agentId: agentUuid.toLowerCase(), state: "selected" };
          } else {
            teamCopy[0] = { ...teamCopy[0], agentId: agentUuid.toLowerCase(), state: "selected" };
          }
        }
        const updatedAllies = teamCopy.map((p) => p.agentId).filter((id): id is string => Boolean(id));
        requestMlDraft(selectedMap, updatedAllies);
        return teamCopy;
      });
    }
  };

  const lockAgent = (agentUuid: string) => {
    if (socketRef.current) {
      socketRef.current.emit("pregame_lock", { pregameMatchId, agentUuid });
    }
    if (!isLiveMode) {
      setMyTeam((prevTeam) => {
        const teamCopy = [...prevTeam];
        const slot = teamCopy.findIndex((p) => p.agentId?.toLowerCase() === agentUuid.toLowerCase());
        if (slot !== -1) {
          teamCopy[slot] = { ...teamCopy[slot], state: "locked" };
        }
        return teamCopy;
      });
    }
  };

  useEffect(() => {
    const serverUrl =
      typeof window !== "undefined" && window.location.port === "3000"
        ? window.location.origin
        : "http://127.0.0.1:3000";

    const socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 100,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("menu-mode");
      setConnectionText("Radar Online");
      // Solicitar predicciones iniciales
      socket.emit("request_ml_draft", {
        mapName: selectedMap,
        allies: myTeam.map((p) => p.agentId).filter(Boolean),
      });
      requestPlayerProfile();
    });

    socket.on("disconnect", () => {
      setConnectionStatus("offline");
      setConnectionText("Radar Offline");
      setView("closed");
      setIsLiveMode(false);
      setIsProfileLoading(false);
    });

    socket.on("player_profile_result", (data: any) => {
      setIsProfileLoading(false);
      if (data && data.success && data.profile) {
        setPlayerProfile(data.profile);
      }
    });

    socket.on("ml_draft_result", (data: any) => {
      if (data) {
        if (Array.isArray(data.recommendations)) {
          setMlRecommendations(data.recommendations);
        }
        if (typeof data.currentSynergy === "number") {
          setMlSynergyWinRate(data.currentSynergy);
        }
        if (Array.isArray(data.agentImpacts)) {
          setMlAgentImpacts(data.agentImpacts);
        }
      }
    });

    socket.on("valorant_status", (data: any) => {
      if (data.status === "CLOSED") {
        setConnectionStatus("offline");
        setConnectionText("Game Offline");
        setView("closed");
        setIsLiveMode(false);
      } else if (data.status === "MENU") {
        setConnectionStatus("menu-mode");
        setConnectionText("In Game Lobby");
        setView("menu");
        setIsLiveMode(false);
        const now = Date.now();
        if (now - lastProfileFetchRef.current > 20000) {
          requestPlayerProfile();
        }
      } else if (data.status === "PREGAME") {
        setConnectionStatus("live");
        setConnectionText("Agent Selection");
        setView("pregame");
        setIsLiveMode(true);
        if (data.pregameMatchId) setPregameMatchId(data.pregameMatchId);
        if (data.mapName) setSelectedMap(data.mapName);
        if (data.mode) setSelectedMode(data.mode.toLowerCase());
        if (data.mlDraftPicks) setMlRecommendations(data.mlDraftPicks);
        if (typeof data.mlSynergyWinRate === 'number') setMlSynergyWinRate(data.mlSynergyWinRate);
        if (Array.isArray(data.mlAgentImpacts)) setMlAgentImpacts(data.mlAgentImpacts);
        if (data.players) {
          setMyTeam(data.players.map((p: any, i: number) => ({
            puuid: p.puuid,
            name: p.puuid === data.myPuuid ? 'You' : `Ally ${i + 1}`,
            agentId: p.agentId ? p.agentId.toLowerCase() : null,
            state: p.state,
            level: p.level || 0,
            rank: p.rank || 0,
            playerCardId: p.playerCardId || ''
          })));
        }
      } else if (data.status === "INGAME") {
        setConnectionStatus("live");
        setConnectionText("In Game Match");
        setView("ingame");
        setIsLiveMode(true);
        if (data.mapName) setSelectedMap(data.mapName);
        if (data.mode) setSelectedMode(data.mode.toLowerCase());
        if (data.players) {
          setMyTeam(data.players.map((p: any, i: number) => ({
            puuid: p.puuid,
            name: p.puuid === data.myPuuid ? 'You' : `Ally ${i + 1}`,
            agentId: p.agentId ? p.agentId.toLowerCase() : null,
            state: p.state,
            level: p.level || 0,
            rank: p.rank || 0,
            playerCardId: p.playerCardId || ''
          })));
        }
      }
    });

    socket.on("buy_phase", (data: any) => {
      const newRound = data.round || 1;
      const newScoreAlly = typeof data.scoreAlly === "number" ? data.scoreAlly : scoreAllyRef.current;
      const newScoreEnemy = typeof data.scoreEnemy === "number" ? data.scoreEnemy : scoreEnemyRef.current;

      // Si la ronda avanzó durante una partida activa, calculamos el nuevo saldo
      if (newRound > currentRoundRef.current && currentRoundRef.current > 0) {
        const outcome: RoundOutcome = newScoreAlly > scoreAllyRef.current ? "win" : "loss";
        
        const econ = advanceRoundEconomy({
          previousBank: creditsRef.current,
          totalSpend: plannedSpendRef.current,
          outcome,
          previousLossStreak: lossStreakRef.current,
          newRound,
        });

        setMyCredits(econ.newCredits);
        setLossStreak(econ.newLossStreak);
        setPlannedSpend(0); // Reiniciar gasto para la nueva fase de compra
      } else if (newRound === 1 || newRound === 13) {
        const reset = getResetCreditsForRound(newRound);
        if (reset !== null) {
          setMyCredits(reset);
          setLossStreak(0);
          setPlannedSpend(0);
        }
      }

      scoreAllyRef.current = newScoreAlly;
      scoreEnemyRef.current = newScoreEnemy;
      setScoreAlly(newScoreAlly);
      setScoreEnemy(newScoreEnemy);
      setCurrentIngameRound(newRound);
      setBuyPhaseAvailable(!!data.available);
      if (data.available && typeof data.time === 'number') {
        setBuyPhaseTime(data.time);
      }
    });

    socket.on("ml_buy_recommendations", (data: any) => {
      if (data && data.buy_recommendations && data.buy_recommendations.length > 0) {
        setBuyRecommendations(data.buy_recommendations[0]);
      }
      if (data && data.enemy_economy) {
        setEnemyEconomy(data.enemy_economy);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Solicitar cálculo de ML si se entra a la vista de draft o cambia el mapa
  useEffect(() => {
    if (view === "pregame" && !isLiveMode) {
      requestMlDraft(selectedMap);
    }
  }, [view, selectedMap]);

  useEffect(() => {
    if (isLiveMode && socketRef.current) {
      socketRef.current.emit('update_ingame_credits', { credits: myCredits });
    }
  }, [myCredits, isLiveMode]);

  return (
    <GameStateContext.Provider
      value={{
        view,
        setView,
        selectedMap,
        setSelectedMap,
        selectedMode,
        setSelectedMode,
        isLiveMode,
        setIsLiveMode,
        connectionStatus,
        connectionText,
        myTeam,
        mlRecommendations,
        mlSynergyWinRate,
        mlAgentImpacts,
        currentIngameRound,
        buyPhaseAvailable,
        buyPhaseTime,
        buyRecommendations,
        enemyEconomy,
        myCredits,
        setMyCredits,
        scoreAlly,
        scoreEnemy,
        lossStreak,
        isFollowingAiRecommendation,
        setIsFollowingAiRecommendation,
        plannedSpend,
        setPlannedSpend,
        pregameMatchId,
        selectAgent,
        lockAgent,
        requestMlDraft,
        playerProfile,
        isProfileLoading,
        requestPlayerProfile,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}


export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error("useGameState must be used within GameStateProvider");
  }
  return context;
}
