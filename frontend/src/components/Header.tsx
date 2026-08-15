"use client";

import { useGameState } from "@/hooks/useGameState";
import { useValorantData } from "@/hooks/useValorantData";

const DEFAULT_MAPS = [
  "Ascent",
  "Bind",
  "Haven",
  "Split",
  "Breeze",
  "Icebox",
  "Sunset",
  "Lotus",
  "Abyss",
  "Pearl",
  "Fracture"
];

const DEFAULT_MODES = [
  { id: "competitive", name: "Competitive" },
  { id: "unrated", name: "Unrated" },
  { id: "swiftplay", name: "Swiftplay" },
  { id: "spikerush", name: "Spike Rush" },
  { id: "deathmatch", name: "Deathmatch" },
  { id: "hurm", name: "Team Deathmatch" },
  { id: "escalation", name: "Escalation" },
  { id: "premier", name: "Premier" },
  { id: "custom", name: "Custom Game" }
];

export default function Header() {
  const { selectedMap, setSelectedMap, selectedMode, setSelectedMode, isLiveMode } = useGameState();
  const { maps, gameModes } = useValorantData();

  // Dynamic maps from API or fallback
  const mapOptions = maps.length > 0
    ? maps.map(m => m.displayName)
    : DEFAULT_MAPS;

  // Dynamic game modes from API or fallback
  const modeOptions = gameModes.length > 0
    ? gameModes.map(g => ({
        id: g.displayName.toLowerCase().replace(/\s+/g, ""),
        name: g.displayName
      }))
    : DEFAULT_MODES;

  return (
    <header>
      <div className="logo-area" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src="/favicon.png"
          alt="LoadoutAI"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            objectFit: "cover",
            filter: "drop-shadow(0 0 6px rgba(0, 240, 255, 0.4))",
          }}
        />
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
            {mapOptions.map((mapName) => (
              <option key={mapName} value={mapName}>
                {mapName}
              </option>
            ))}
          </select>
        </div>

        <div className="mode-selector-wrap">
          <div className="mode-selector-label">Game Mode:</div>
          <select
            className="mode-select"
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
          >
            {modeOptions.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.name}
              </option>
            ))}
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
