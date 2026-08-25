"use client";

import { useGameState } from "@/hooks/useGameState";
import { useLanguage } from "@/context/LanguageContext";
import { DEFAULT_MAP_NAMES } from "@/data/mapsData";
import { DEFAULT_GAME_MODES } from "@/data/gameModesData";
import {
  ProfileIcon,
  DraftIcon,
  RadarIcon,
  TierListIcon,
  ToolsIcon,
  GlobeIcon,
} from "@/components/Icons";

export default function Header() {
  const {
    view,
    setView,
    selectedMap,
    selectedMode,
    connectionStatus,
    playerProfile,
  } = useGameState();

  const { language, setLanguage, t } = useLanguage();

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
        <div className="header-logo-badge" onClick={() => setView("menu")} title="Loadout AI Home">
          <img
            src="/favicon.png"
            alt="LoadoutAI"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "5px",
              objectFit: "cover",
              flexShrink: 0,
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
          title={t.profile}
        >
          <ProfileIcon size={15} />
          <span className="nav-tab-label">{t.profile}</span>
        </button>

        <button
          className={`nav-tab ${isDraftActive ? "active" : ""}`}
          onClick={() => setView("pregame")}
          title={t.draftCoach}
        >
          <DraftIcon size={15} />
          <span className="nav-tab-label">{t.draftCoach}</span>
          <span className="nav-tab-badge">AI</span>
        </button>

        <button
          className={`nav-tab ${isRadarActive ? "active" : ""}`}
          onClick={() => setView("ingame")}
          title={t.tacticalRadar}
        >
          <RadarIcon size={15} />
          <span className="nav-tab-label">{t.tacticalRadar}</span>
        </button>

        <button
          className={`nav-tab ${isTierListActive ? "active" : ""}`}
          onClick={() => setView("tierlist")}
          title={t.tierList}
        >
          <TierListIcon size={15} />
          <span className="nav-tab-label">{t.tierList}</span>
        </button>

        <button
          className={`nav-tab ${isToolsActive ? "active" : ""}`}
          onClick={() => setView("tools")}
          title={t.tools}
        >
          <ToolsIcon size={15} />
          <span className="nav-tab-label">{t.tools}</span>
        </button>
      </nav>

      {/* Right Area: Selectors, Language, Player Profile */}
      <div className="header-right">
        {/* Live Detected Map & Mode Display Badges (solo visible en Pregame e Ingame / Compras) */}
        {(isDraftActive || isRadarActive) && (
          <div className="header-selectors-group">
            <div
              className="compact-select-wrap header-map-badge"
              style={{ cursor: "default", userSelect: "none" }}
              title={language === "es" ? "Mapa detectado automáticamente" : "Map automatically detected"}
            >
              <span className="compact-select-label">{t.map}:</span>
              <span className="compact-select-value">
                {selectedMap || DEFAULT_MAP_NAMES[0]}
              </span>
            </div>

            <div
              className="compact-select-wrap header-mode-badge"
              style={{ cursor: "default", userSelect: "none" }}
              title={language === "es" ? "Modo detectado automáticamente" : "Mode automatically detected"}
            >
              <span className="compact-select-label">{t.mode}:</span>
              <span className="compact-select-value">
                {selectedMode || DEFAULT_GAME_MODES[0].name.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Language Switcher */}
        <div
          className="compact-select-wrap header-lang-switcher"
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
          onClick={() => setLanguage(language === "es" ? "en" : "es")}
          title="Change language / Cambiar idioma"
        >
          <GlobeIcon size={13} />
          <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--color-cyan)" }}>
            {language.toUpperCase()}
          </span>
        </div>

        {/* User Profile Pill */}
        <div className="header-user-profile" onClick={() => setView("menu")} title="Ver Perfil">
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
