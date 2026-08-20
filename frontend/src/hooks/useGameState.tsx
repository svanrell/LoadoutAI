"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

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
  currentIngameRound: number;
  buyPhaseAvailable: boolean;
  buyPhaseTime: number;
  buyRecommendations: BuyRecommendation | null;
  enemyEconomy: EnemyEconomy | null;
  myCredits: number;
  setMyCredits: (credits: number) => void;
  pregameMatchId: string | null;
  selectAgent: (agentUuid: string) => void;
  lockAgent: (agentUuid: string) => void;
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
      puuid: `p${i}`, name: `Ally ${i+1}`, agentId: null, state: "", level: 0, rank: 0, playerCardId: ""
    }))
  );
  
  const [mlRecommendations, setMlRecommendations] = useState<MLDraftRecommendation[]>([]);
  const [mlSynergyWinRate, setMlSynergyWinRate] = useState<number>(50.0);
  const [currentIngameRound, setCurrentIngameRound] = useState(1);
  const [buyPhaseAvailable, setBuyPhaseAvailable] = useState(false);
  const [buyPhaseTime, setBuyPhaseTime] = useState(0);
  const [buyRecommendations, setBuyRecommendations] = useState<BuyRecommendation | null>(null);
  const [enemyEconomy, setEnemyEconomy] = useState<EnemyEconomy | null>(null);
  const [myCredits, setMyCredits] = useState(3900);
  const [pregameMatchId, setPregameMatchId] = useState<string | null>(null);


  const socketRef = useRef<Socket | null>(null);

  const selectAgent = (agentUuid: string) => {
    if (socketRef.current) {
      socketRef.current.emit("pregame_select", { pregameMatchId, agentUuid });
    }
  };

  const lockAgent = (agentUuid: string) => {
    if (socketRef.current) {
      socketRef.current.emit("pregame_lock", { pregameMatchId, agentUuid });
    }
  };

  useEffect(() => {
    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("menu-mode");
      setConnectionText("Radar Online");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("offline");
      setConnectionText("Radar Offline");
      setView("closed");
      setIsLiveMode(false);
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
      setCurrentIngameRound(data.round || 1);
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
        currentIngameRound,
        buyPhaseAvailable,
        buyPhaseTime,
        buyRecommendations,
        enemyEconomy,
        myCredits,
        setMyCredits,
        pregameMatchId,
        selectAgent,
        lockAgent,
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
