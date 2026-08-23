"use client";

import { useGameState } from "@/hooks/useGameState";
import { useValorantData } from "@/hooks/useValorantData";
import { useLanguage } from "@/context/LanguageContext";
import {
  ProfileIcon,
  DraftIcon,
  RadarIcon,
  TierListIcon,
  ToolsIcon,
  GlobeIcon,
} from "@/components/Icons";

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
  "Fracture",
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
  { id: "custom", name: "Custom Game" },
];

export default function Header() {
  const {
    view,
    setView,
    selectedMap,
    setSelectedMap,
    selectedMode,
    setSelectedMode,
    connectionStatus,
    playerProfile,
  } = useGameState();

  const { language, setLanguage, t } = useLanguage();
  const { maps, gameModes, agents } = useValorantData();

  const mapOptions =
    maps.length > 0 ? maps.map((m) => m.displayName) : DEFAULT_MAPS;

  const modeOptions =
    gameModes.length > 0
      ? gameModes.map((g) => ({
          id: g.displayName.toLowerCase().replace(/\s+/g, ""),
          name: g.displayName,
        }))
      : DEFAULT_MODES;

  const isProfileActive = view === "menu" || view === "closed";
  const isDraftActive = view === "pregame";
  const isRadarActive = view === "ingame";
  const isTierListActive = view === "tierlist";
  const isToolsActive = view === "tools";

  // Foto de perfil oficial del juego (Player Card)
  const userAvatar = playerProfile?.playerCardId
    ? `https://media.valorant-api.com/playercards/${playerProfile.playerCardId}/smallart.png`
    : "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png";

  return (
    <header>
      {/* Left Area: Brand & Logo */}
      <div className="header-left">
        <div className="header-logo-badge" onClick={() => setView("menu")}>
          <img
            src="/favicon.png"
            alt="LoadoutAI"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              objectFit: "cover",
              filter: "drop-shadow(0 0 6px rgba(0, 240, 255, 0.4))",
            }}
          />
          <div className="logo-title">
            LOADOUT<span>AI</span>
          </div>
          <span className="logo-version-tag">v1.0</span>
        </div>
      </div>

      {/* Center Area: Navigation Tabs (Clean Esports SVGs) */}
      <nav className="header-nav">
        <button
          className={`nav-tab ${isProfileActive ? "active" : ""}`}
          onClick={() => setView("menu")}
        >
          <ProfileIcon size={15} />
          <span>{t.profile}</span>
        </button>

        <button
          className={`nav-tab ${isDraftActive ? "active" : ""}`}
          onClick={() => setView("pregame")}
        >
          <DraftIcon size={15} />
          <span>{t.draftCoach}</span>
          <span className="nav-tab-badge">AI</span>
        </button>

        <button
          className={`nav-tab ${isRadarActive ? "active" : ""}`}
          onClick={() => setView("ingame")}
        >
          <RadarIcon size={15} />
          <span>{t.tacticalRadar}</span>
        </button>

        <button
          className={`nav-tab ${isTierListActive ? "active" : ""}`}
          onClick={() => setView("tierlist")}
          title={t.tierList}
        >
          <TierListIcon size={15} />
          <span>{t.tierList}</span>
        </button>

        <button
          className={`nav-tab ${isToolsActive ? "active" : ""}`}
          onClick={() => setView("tools")}
          title={t.tools}
        >
          <ToolsIcon size={15} />
          <span>{t.tools}</span>
        </button>
      </nav>

      {/* Right Area: Selectors, Language, Discord, Player Profile */}
      <div className="header-right">
        {/* Live Detected Map & Mode Display Badges (solo visible en Pregame e Ingame / Compras) */}
        {(isDraftActive || isRadarActive) && (
          <div className="header-selectors-group">
            <div
              className="compact-select-wrap"
              style={{ cursor: "default", userSelect: "none" }}
              title={language === "es" ? "Mapa detectado automáticamente por el cliente" : "Map automatically detected from game client"}
            >
              <span className="compact-select-label">{t.map}:</span>
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--color-cyan)",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {selectedMap || "ASCENT"}
              </span>
            </div>

            <div
              className="compact-select-wrap"
              style={{ cursor: "default", userSelect: "none" }}
              title={language === "es" ? "Modo detectado automáticamente por el cliente" : "Mode automatically detected from game client"}
            >
              <span className="compact-select-label">{t.mode}:</span>
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--color-cyan)",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {selectedMode || "COMPETITIVE"}
              </span>
            </div>
          </div>
        )}

        {/* Language Switcher */}
        <div
          className="compact-select-wrap"
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
          onClick={() => setLanguage(language === "es" ? "en" : "es")}
          title="Change language / Cambiar idioma"
        >
          <GlobeIcon size={13} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-cyan)" }}>
            {language.toUpperCase()}
          </span>
        </div>

        {/* User Profile Pill */}
        <div className="header-user-profile" onClick={() => setView("menu")}>
          <div className="header-avatar-wrap">
            <img
              src={userAvatar}
              alt="Avatar"
              className="header-avatar"
            />
            <span
              className="header-avatar-status"
              style={{
                backgroundColor:
                  connectionStatus === "live"
                    ? "var(--color-green)"
                    : connectionStatus === "menu-mode"
                    ? "var(--color-yellow)"
                    : "var(--color-red)",
              }}
            />
          </div>

          <div className="header-user-info">
            <span className="header-username">
              {playerProfile ? `${playerProfile.gameName} #${playerProfile.tagLine}` : "Player #LIVE"}
            </span>
            <span className="header-user-tier">
              {playerProfile?.rankName ? `${playerProfile.rankName.toUpperCase()} • ${playerProfile.rankedRating} RR` : t.currentRank}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
