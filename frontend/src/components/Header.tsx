"use client";

import { useGameState } from "@/hooks/useGameState";

export default function Header() {
  const { selectedMap, setSelectedMap, selectedMode, setSelectedMode, isLiveMode } = useGameState();

  return (
    <header>
      <div className="logo-area">
        <svg width="24" height="24" viewBox="0 0 100 100">
          <path d="M10 20 L50 90 L90 20 L50 40 Z" />
        </svg>
        <div className="logo-title">
          LOADOUT<span>AI</span>
        </div>
      </div>

      <div className="status-container">
        <div className="map-selector-wrap">
          <div className="map-selector-label">Tactical Map:</div>
          <select
            className="map-select"
            value={selectedMap}
            onChange={(e) => setSelectedMap(e.target.value)}
          >
            <option value="Ascent">Ascent</option>
            <option value="Bind">Bind</option>
            <option value="Haven">Haven</option>
            <option value="Split">Split</option>
            <option value="Breeze">Breeze</option>
            <option value="Icebox">Icebox</option>
            <option value="Sunset">Sunset</option>
            <option value="Lotus">Lotus</option>
          </select>
        </div>

        <div className="mode-selector-wrap">
          <div className="mode-selector-label">Game Mode:</div>
          <select
            className="mode-select"
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
          >
            <option value="competitive">Competitive</option>
            <option value="unrated">Unrated</option>
            <option value="swiftplay">Swiftplay</option>
            <option value="spikerush">Spike Rush</option>
            <option value="deathmatch">Deathmatch</option>
            <option value="escalation">Escalation</option>
            <option value="custom">Custom Game</option>
          </select>
        </div>

        <div
          className={`status-badge ${
            isLiveMode ? "status-online" : "status-offline"
          }`}
        >
          <span className="status-dot"></span>
          <span>
            {isLiveMode ? "Radar Live Integration" : "Valorant Game is Offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
