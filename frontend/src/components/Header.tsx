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
        {/* Live Detected Map & Mode Display Badges */}
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

        {/* Discord Icon */}
        <button
          className="header-icon-btn"
          title="Discord"
          onClick={() => window.open("https://discord.gg", "_blank")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </button>

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
            <span className="header-username">shumi747 #2721</span>
            <span className="header-user-tier">
              GOLD IV • 23 RR
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
