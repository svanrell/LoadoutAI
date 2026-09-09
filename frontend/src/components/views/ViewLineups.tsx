"use client";

import { useState, useMemo } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useLanguage } from "@/context/LanguageContext";
import { LineupIcon } from "@/components/Icons";

export interface LineupItem {
  id: string;
  title: string;
  agent: string;
  agentIcon?: string;
  map: string;
  side: "attack" | "defense";
  site: "A" | "B" | "C" | "Mid";
  ability: string;
  abilityIcon?: string;
  difficulty: "Fácil" | "Media" | "Avanzada";
  throwType: string;
  standPosition: string;
  aimCue: string;
  landingEffect: string;
  mapSplash?: string;
}

interface ViewLineupsProps {
  /**
   * Pasa aquí los lineups obtenidos de tu backend.
   * Si está vacío, se muestra el estado visual vacío listo para recibir datos.
   */
  lineups?: LineupItem[];
}

const MAP_FILTERS = ["Todos", "Ascent", "Bind", "Haven", "Sunset", "Split", "Lotus", "Breeze", "Icebox"];
const AGENT_FILTERS = ["Todos", "Sova", "Viper", "Brimstone", "Killjoy", "Fade", "Gekko"];

export default function ViewLineups({ lineups = [] }: ViewLineupsProps) {
  const { setView } = useGameState();
  const { t, language } = useLanguage();

  // Estados visuales de filtros
  const [selectedMap, setSelectedMap] = useState<string>("Todos");
  const [selectedAgent, setSelectedAgent] = useState<string>("Todos");
  const [selectedSide, setSelectedSide] = useState<"all" | "attack" | "defense">("all");
  const [selectedSite, setSelectedSite] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [activeLineupModal, setActiveLineupModal] = useState<LineupItem | null>(null);

  // Filtrado visual sobre los datos que reciba del backend
  const filteredLineups = useMemo(() => {
    return lineups.filter((item) => {
      if (selectedMap !== "Todos" && item.map.toLowerCase() !== selectedMap.toLowerCase()) {
        return false;
      }
      if (selectedAgent !== "Todos" && item.agent.toLowerCase() !== selectedAgent.toLowerCase()) {
        return false;
      }
      if (selectedSide !== "all" && item.side !== selectedSide) {
        return false;
      }
      if (selectedSite !== "Todos" && item.site !== selectedSite) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.ability.toLowerCase().includes(q) ||
          item.agent.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [lineups, selectedMap, selectedAgent, selectedSide, selectedSite, searchQuery]);

  return (
    <div
      className="state-view active"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        maxWidth: "1350px",
        margin: "0 auto",
        width: "100%",
        padding: "24px 20px",
        boxSizing: "border-box",
      }}
    >
      {/* Top Banner Visual */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16, 22, 34, 0.95), rgba(11, 18, 25, 0.9))",
          border: "1px solid var(--border-cyber)",
          borderRadius: "10px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1.5px solid var(--color-green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-green)",
              boxShadow: "0 0 15px rgba(16, 185, 129, 0.25)",
            }}
          >
            <LineupIcon size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1
                style={{
                  fontFamily: "Orbitron, sans-serif",
                  fontSize: "19px",
                  fontWeight: 800,
                  color: "var(--text-main)",
                  letterSpacing: "1px",
                  margin: 0,
                }}
              >
                {t.lineups.toUpperCase()}
              </h1>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  color: "var(--color-green)",
                  letterSpacing: "0.5px",
                }}
              >
                TACTICAL VAULT
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", marginBottom: 0 }}>
              {t.lineupsDesc}
            </p>
          </div>
        </div>

        <button
          className="cyber-btn-secondary"
          onClick={() => setView("menu")}
          style={{ padding: "7px 14px", fontSize: "11px", fontWeight: 700 }}
        >
          {t.backToProfile}
        </button>
      </div>

      {/* Filter Section Visual */}
      <div
        style={{
          background: "rgba(16, 22, 34, 0.8)",
          border: "1px solid var(--border-cyber)",
          borderRadius: "10px",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Row 1: Search & Side & Site */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          {/* Search Input */}
          <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === "es" ? "Buscar por flecha, post-plant, molly..." : "Search recon, post-plant, molly..."}
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "#fff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Side Filter */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, marginRight: "4px" }}>
              {language === "es" ? "BANDO:" : "SIDE:"}
            </span>
            {[
              { id: "all", label: language === "es" ? "TODOS" : "ALL" },
              { id: "attack", label: language === "es" ? "ATAQUE" : "ATTACK", color: "var(--color-red)" },
              { id: "defense", label: language === "es" ? "DEFENSA" : "DEFENSE", color: "var(--color-cyan)" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSide(s.id as any)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  border: selectedSide === s.id ? `1px solid ${s.color || "var(--color-green)"}` : "1px solid rgba(255,255,255,0.08)",
                  background: selectedSide === s.id ? (s.color ? `${s.color}22` : "rgba(16, 185, 129, 0.15)") : "rgba(0,0,0,0.2)",
                  color: selectedSide === s.id ? (s.color || "var(--color-green)") : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Site Filter */}
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, marginRight: "4px" }}>
              SITE:
            </span>
            {["Todos", "A", "B", "C", "Mid"].map((site) => (
              <button
                key={site}
                onClick={() => setSelectedSite(site)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  border: selectedSite === site ? "1px solid var(--color-yellow)" : "1px solid rgba(255,255,255,0.08)",
                  background: selectedSite === site ? "rgba(245, 158, 11, 0.15)" : "rgba(0,0,0,0.2)",
                  color: selectedSite === site ? "var(--color-yellow)" : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {site}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Map Pills */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, minWidth: "60px" }}>
            {language === "es" ? "MAPA:" : "MAP:"}
          </span>
          {MAP_FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMap(m)}
              style={{
                padding: "3px 10px",
                borderRadius: "4px",
                fontSize: "10.5px",
                fontWeight: 600,
                border: selectedMap === m ? "1px solid var(--color-cyan)" : "1px solid rgba(255,255,255,0.08)",
                background: selectedMap === m ? "rgba(56, 189, 248, 0.15)" : "rgba(255,255,255,0.02)",
                color: selectedMap === m ? "var(--color-cyan)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.1s ease",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Row 3: Agent Pills */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, minWidth: "60px" }}>
            {language === "es" ? "AGENTE:" : "AGENT:"}
          </span>
          {AGENT_FILTERS.map((ag) => (
            <button
              key={ag}
              onClick={() => setSelectedAgent(ag)}
              style={{
                padding: "3px 10px",
                borderRadius: "4px",
                fontSize: "10.5px",
                fontWeight: 600,
                border: selectedAgent === ag ? "1px solid var(--color-green)" : "1px solid rgba(255,255,255,0.08)",
                background: selectedAgent === ag ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.02)",
                color: selectedAgent === ag ? "var(--color-green)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.1s ease",
              }}
            >
              {ag}
            </button>
          ))}
        </div>
      </div>

      {/* Counter / Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {language === "es"
            ? `Mostrando ${filteredLineups.length} lineup${filteredLineups.length !== 1 ? "s" : ""}`
            : `Showing ${filteredLineups.length} lineup${filteredLineups.length !== 1 ? "s" : ""}`}
        </span>
        {(selectedMap !== "Todos" || selectedAgent !== "Todos" || selectedSide !== "all" || selectedSite !== "Todos" || searchQuery) && (
          <button
            onClick={() => {
              setSelectedMap("Todos");
              setSelectedAgent("Todos");
              setSelectedSide("all");
              setSelectedSite("Todos");
              setSearchQuery("");
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-red)",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {language === "es" ? "LIMPIAR FILTROS ↺" : "CLEAR FILTERS ↺"}
          </button>
        )}
      </div>

      {/* Grid de Tarjetas o Estado Vacío */}
      {filteredLineups.length === 0 ? (
        <div
          style={{
            background: "rgba(16, 22, 34, 0.5)",
            border: "1px dashed rgba(255, 255, 255, 0.12)",
            borderRadius: "10px",
            padding: "50px 20px",
            textAlign: "center",
            color: "var(--text-muted)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "36px" }}>🎯</div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>
            {language === "es" ? "Sin lineups para mostrar" : "No lineups to display"}
          </div>
          <p style={{ fontSize: "12px", maxWidth: "450px", margin: 0, lineHeight: 1.5 }}>
            {language === "es"
              ? "Conecta tu backend pasando la lista de lineups al componente para visualizar tus jugadas tácticas."
              : "Connect your backend by passing the lineup data list to this component to display your setups."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {filteredLineups.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveLineupModal(item)}
              style={{
                background: "rgba(16, 22, 34, 0.85)",
                border: "1px solid var(--border-cyber)",
                borderRadius: "10px",
                overflow: "hidden",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-green)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-cyber)";
                e.currentTarget.style.transform = "none";
              }}
            >
              {/* Banner */}
              <div style={{ height: "110px", position: "relative", overflow: "hidden", background: "#0a0e14" }}>
                {item.mapSplash && (
                  <img
                    src={item.mapSplash}
                    alt={item.map}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "brightness(0.65) saturate(1.2)",
                    }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(16, 22, 34, 0.95) 0%, transparent 60%)",
                  }}
                />

                {/* Badges */}
                <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(0, 0, 0, 0.75)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#fff",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.map} • SITE {item.site}
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: item.side === "attack" ? "rgba(255, 70, 85, 0.3)" : "rgba(56, 189, 248, 0.3)",
                      border: item.side === "attack" ? "1px solid var(--color-red)" : "1px solid var(--color-cyan)",
                      color: item.side === "attack" ? "var(--color-red)" : "var(--color-cyan)",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.side}
                  </span>
                </div>

                <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(16, 185, 129, 0.2)",
                      color: "var(--color-green)",
                      border: "1px solid currentColor",
                    }}
                  >
                    {item.difficulty}
                  </span>
                </div>

                {/* Agent Info */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    left: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {item.agentIcon && (
                    <img
                      src={item.agentIcon}
                      alt={item.agent}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        background: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    />
                  )}
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>{item.agent}</span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                <h3 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
                  {item.title}
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--color-cyan)" }}>
                  {item.abilityIcon && (
                    <img src={item.abilityIcon} alt={item.ability} style={{ width: "16px", height: "16px", filter: "invert(1)" }} />
                  )}
                  <span>{item.ability}</span>
                </div>

                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ color: "var(--color-yellow)", fontWeight: 700, fontSize: "10.5px" }}>
                    ⚡ {item.throwType}
                  </div>
                  <div style={{ fontSize: "11px", color: "#f8fafc", lineHeight: 1.4 }}>
                    {item.landingEffect}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--color-green)",
                  }}
                >
                  <span>{language === "es" ? "VER GUÍA" : "VIEW GUIDE"}</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal Visual */}
      {activeLineupModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setActiveLineupModal(null)}
        >
          <div
            style={{
              background: "#101622",
              border: "1px solid var(--border-cyber)",
              borderRadius: "12px",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-cyber)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(16, 22, 34, 0.95)",
              }}
            >
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#fff" }}>
                  {activeLineupModal.title}
                </h2>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                  {activeLineupModal.agent} • {activeLineupModal.map} • SITE {activeLineupModal.site}
                </span>
              </div>

              <button
                onClick={() => setActiveLineupModal(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "14px",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-cyan)", marginBottom: "4px" }}>
                  1. POSICIÓN INICIAL
                </div>
                <p style={{ fontSize: "12.5px", color: "#f8fafc", margin: 0 }}>
                  {activeLineupModal.standPosition}
                </p>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "14px",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-yellow)", marginBottom: "4px" }}>
                  2. REFERENCIA DE MIRA / HUD
                </div>
                <p style={{ fontSize: "12.5px", color: "#f8fafc", margin: 0 }}>
                  {activeLineupModal.aimCue}
                </p>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "14px",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-green)", marginBottom: "4px" }}>
                  3. IMPACTO TÁCTICO
                </div>
                <p style={{ fontSize: "12.5px", color: "#f8fafc", margin: 0 }}>
                  {activeLineupModal.landingEffect}
                </p>
              </div>

              <button
                onClick={() => setActiveLineupModal(null)}
                className="cyber-btn-secondary"
                style={{ alignSelf: "flex-end", padding: "8px 16px", fontSize: "12px", fontWeight: 700 }}
              >
                {language === "es" ? "CERRAR" : "CLOSE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
