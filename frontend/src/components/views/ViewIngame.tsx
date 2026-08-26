"use client";

import { useValorantData, Weapon } from "@/hooks/useValorantData";
import { useGameState } from "@/hooks/useGameState";
import { getAbilityPrice } from "@/data/agentAbilitiesData";
import { getMapSplash } from "@/data/mapsData";
import {
  ARMORS_DATA,
  WeaponCategoryConfig,
  getProcessedWeapons,
  getCategoryWeapons,
  getWeaponAffordability,
} from "@/data/weaponsData";
import { useState, useMemo, useCallback } from "react";

// Estado de compra de cada habilidad: 'owned' (ya comprada/en posesión) o 'buy' (disponible para comprar)
export type AbilityStatus = "owned" | "buy";

export default function ViewIngame() {
  // 1. Hook para obtener datos estáticos (agentes, catálogo de armas de Riot API)
  const { agents, weapons: rawWeapons } = useValorantData();

  // 2. Hook del estado en tiempo real del juego (equipo, créditos actuales, fase de compra, mapa detectado)
  const { myTeam, myCredits, buyPhaseAvailable, selectedMap, playerProfile } = useGameState();

  // 3. Estado local para saber qué arma tiene el cursor encima (hover) y mostrar sus estadísticas
  const [hoveredWeapon, setHoveredWeapon] = useState<Weapon | null>(null);

  // 4. Detección del agente del jugador actual ("You" en vivo o el agente seleccionado)
  const myPlayer = myTeam.find((p) => p.name === "You") || myTeam.find((p) => p.agentId) || myTeam[0];
  const rawAgentId = myPlayer?.agentId;
  const isAgentDetected = Boolean(rawAgentId && rawAgentId.trim() !== "");
  // Si estamos en modo demo (sin juego abierto ni agente seleccionado), usamos el UUID de Jett por defecto
  const myAgentId = isAgentDetected && rawAgentId ? rawAgentId : "add6443a-41bd-e414-f6ad-e58d267f4e95";

  // 🧠 useMemo: Busca al agente en la lista solo si 'agents' o 'myAgentId' cambian.
  // Evita recorrer el array de agentes en cada renderizado.
  const myAgent = useMemo(() => {
    return agents.find((a) => a.uuid.toLowerCase() === myAgentId.toLowerCase());
  }, [agents, myAgentId]);

  const myAgentName = myAgent?.displayName || "Jett";
  const myAgentIcon =
    myAgent?.displayIcon ||
    "https://media.valorant-api.com/agents/add6443c-41c1-48b0-a04a-a71c8b3269a9/displayicon.png";
  const myAbilities = myAgent?.abilities || [];

  // 🧠 useMemo: Filtra las 3 habilidades básicas (excluyendo la Ultimate que no se compra en tienda)
  const basicAbilities = useMemo(() => {
    return myAbilities.filter((a) => a.slot !== "Ultimate").slice(0, 3);
  }, [myAbilities]);

  // 🎯 useState: Diccionario para registrar si cada habilidad está comprada o no
  const [abilityStatuses, setAbilityStatuses] = useState<Record<string, AbilityStatus>>({});

  // 🎯 useState: Blindaje/escudo equipado actualmente (null = sin escudo / no comprado; o Ligera, Regen, Pesada)
  const [equippedArmorName, setEquippedArmorName] = useState<string | null>(null);

  // ⚡ useCallback: Función memorizada para alternar el estado de compra de una habilidad (comprado <-> no comprado)
  // Al usar useCallback con dependencias vacías [], la función mantiene la misma referencia en memoria.
  const toggleAbilityStatus = useCallback((slotOrName: string) => {
    setAbilityStatuses((prev) => {
      const current = prev[slotOrName] || "buy";
      return {
        ...prev,
        [slotOrName]: current === "owned" ? "buy" : "owned",
      };
    });
  }, []);

  // ⚡ useCallback: Función memorizada para equipar/desequipar un escudo al hacer clic
  const toggleArmor = useCallback((armorName: string) => {
    setEquippedArmorName((current) => (current === armorName ? null : armorName));
  }, []);

  // 🧠 useMemo: Procesa, ordena y desduplica el catálogo de armas de la tienda
  const allWeapons = useMemo(() => getProcessedWeapons(rawWeapons), [rawWeapons]);

  const renderWeaponCol = (categories: WeaponCategoryConfig[]) => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(0.5rem, 1vh, 1rem)",
          flex: 1,
          minWidth: 0,
        }}
      >
        {categories.map((cat) => {
          const groupWeapons = getCategoryWeapons(allWeapons, cat.id);

          return (
            <div
              key={cat.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "clamp(0.2rem, 0.4vh, 0.35rem)",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontSize: "clamp(0.6rem, 0.95vh, 0.76rem)",
                  fontWeight: 900,
                  color: "#f1f5f9",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "0.15rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={cat.title}
              >
                {cat.title}
              </div>
              {groupWeapons.map((w) => {
                if (!w.shopData) return null;
                const status = getWeaponAffordability(w.shopData.cost, myCredits);

                const border = "1px solid rgba(255, 255, 255, 0.16)";
                const bg = "rgba(16, 24, 38, 0.72)";
                const color = status === "unaffordable" ? "var(--color-red)" : "#f8fafc";

                const isClassic = w.displayName.toUpperCase() === "CLASSIC";
                const costDisplay = isClassic ? "GRATIS" : `¤${w.shopData.cost}`;
                const nameDisplay = isClassic ? "CLASSIC" : w.displayName;
                const statusLabel = isClassic ? "COMPRADO" : "";

                return (
                  <div
                    key={w.uuid}
                    onMouseEnter={() => setHoveredWeapon(w)}
                    onMouseLeave={() => setHoveredWeapon(null)}
                    style={{
                      border,
                      background: bg,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      cursor: "pointer",
                      height: "clamp(2.8rem, 5.2vh, 4.2rem)",
                      transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                      borderRadius: "0.25rem",
                      backdropFilter: "blur(6px)",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)";
                      e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.45)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = bg;
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
                    }}
                  >
                    {statusLabel && (
                      <div
                        style={{
                          position: "absolute",
                          top: "0.25rem",
                          right: "0.45rem",
                          fontSize: "clamp(0.5rem, 0.8vh, 0.62rem)",
                          color: "var(--color-cyan)",
                          fontWeight: 900,
                          zIndex: 2,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {statusLabel}
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "1.15rem",
                        right: "0.45rem",
                        fontSize: "clamp(0.58rem, 0.95vh, 0.74rem)",
                        color,
                        fontWeight: 900,
                        zIndex: 2,
                      }}
                    >
                      {costDisplay}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "0.25rem",
                        right: "0.45rem",
                        fontSize: "clamp(0.64rem, 1.05vh, 0.82rem)",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        color: "#f8fafc",
                        zIndex: 2,
                      }}
                    >
                      {nameDisplay}
                    </div>
                    <img
                      src={w.displayIcon}
                      alt={w.displayName}
                      style={{
                        maxHeight: "clamp(1.6rem, 3.2vh, 2.5rem)",
                        maxWidth: "62%",
                        objectFit: "contain",
                        filter:
                          status === "unaffordable" ? "grayscale(100%) opacity(0.6)" : "none",
                        position: "absolute",
                        top: "50%",
                        left: "36%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 1,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderArmorCol = () => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(0.5rem, 1vh, 1rem)",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: "clamp(0.6rem, 0.95vh, 0.76rem)",
            fontWeight: 900,
            color: "#f1f5f9",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: "0.15rem",
          }}
        >
          ESCUDOS
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(0.3rem, 0.6vh, 0.5rem)",
          }}
        >
          {ARMORS_DATA.map((a) => {
            const isOwned = equippedArmorName === a.name;
            const status = getWeaponAffordability(a.cost, myCredits);
            const color = status === "unaffordable" && !isOwned ? "var(--color-red)" : "#f8fafc";

            const border = isOwned
              ? "1.5px solid var(--color-cyan)"
              : "1px solid rgba(255, 255, 255, 0.16)";
            const bg = isOwned
              ? "rgba(56, 189, 248, 0.14)"
              : "rgba(16, 24, 38, 0.72)";
            const shadow = isOwned
              ? "0 0 16px rgba(56, 189, 248, 0.25)"
              : "none";

            return (
              <div
                key={a.name}
                onClick={() => toggleArmor(a.name)}
                style={{
                  border,
                  background: bg,
                  boxShadow: shadow,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  cursor: "pointer",
                  height: "clamp(5.8rem, 10.8vh, 8.5rem)",
                  borderRadius: "0.25rem",
                  transition: "all 0.2s ease",
                  backdropFilter: "blur(6px)",
                }}
                onMouseOver={(e) => {
                  if (!isOwned) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)";
                    e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.45)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isOwned) {
                    e.currentTarget.style.background = "rgba(16, 24, 38, 0.72)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
                  }
                }}
                title={
                  isOwned
                    ? `Click para desequipar: ${a.name}`
                    : `Click para equipar (reemplaza cualquier otro escudo): ${a.name}`
                }
              >
                {/* Badge COMPRADO */}
                {isOwned && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0.3rem",
                      right: "0.5rem",
                      fontSize: "clamp(0.5rem, 0.8vh, 0.62rem)",
                      color: "var(--color-cyan)",
                      fontWeight: 900,
                      zIndex: 2,
                      letterSpacing: "0.05em",
                    }}
                  >
                    COMPRADO
                  </div>
                )}

                {/* Cost display */}
                {!isOwned && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "1.3rem",
                      right: "0.5rem",
                      fontSize: "clamp(0.6rem, 0.95vh, 0.76rem)",
                      color,
                      fontWeight: 900,
                      zIndex: 2,
                    }}
                  >
                    ¤{a.cost}
                  </div>
                )}

                {/* Shield name */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "0.3rem",
                    right: "0.5rem",
                    fontSize: "clamp(0.62rem, 1vh, 0.78rem)",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    color: isOwned ? "var(--text-main)" : "#f8fafc",
                    zIndex: 2,
                  }}
                >
                  {a.name}
                </div>

                {/* Shield Icon */}
                <img
                  src={a.icon}
                  alt={a.name}
                  style={{
                    maxHeight: "clamp(2.6rem, 5vh, 4rem)",
                    maxWidth: "60%",
                    objectFit: "contain",
                    filter: isOwned
                      ? "drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))"
                      : status === "unaffordable"
                      ? "grayscale(100%) opacity(0.6)"
                      : "grayscale(25%) opacity(0.75)",
                    position: "absolute",
                    top: "40%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 1,
                    transition: "filter 0.2s ease",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const [forceShow, setForceShow] = useState(false);

  if (!buyPhaseAvailable && !forceShow) {
    return (
      <div
        id="viewIngame"
        className="state-view active"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
          background: "rgba(0,0,0,0.85)",
          padding: "1.5rem",
        }}
      >
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(1.2rem, 2.2vh, 1.8rem)" }}>
          Ronda en progreso...
        </h2>
        <button
          onClick={() => setForceShow(true)}
          style={{
            marginTop: "1.5rem",
            padding: "0.8rem 1.8rem",
            background: "var(--color-cyan)",
            color: "#000",
            border: "none",
            borderRadius: "0.3rem",
            cursor: "pointer",
            fontWeight: 900,
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(0.85rem, 1.2vh, 1rem)",
            letterSpacing: "0.08em",
            boxShadow: "0 0 15px rgba(56, 189, 248, 0.3)",
          }}
        >
          VER MENÚ DE COMPRA (OFFLINE)
        </button>
      </div>
    );
  }

  return (
    <div
      id="viewIngame"
      className="state-view active"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        background: `url(${getMapSplash(selectedMap)}) center center / cover no-repeat`,
        height: "100%",
        width: "100%",
        overflowY: "auto",
        padding: "clamp(0.6rem, 1.6vh, 1.5rem) clamp(0.6rem, 1.8vw, 2rem)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(10, 14, 20, 0.76)", zIndex: 1 }}></div>

      {/* Main Hub Container */}
      <div
        style={{
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "106rem",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          gap: "clamp(1.2rem, 2.4vh, 2.2rem)", // "Un palmo" de separación entre armory y habilidades
        }}
      >
        {/* Top Section: [Left Compact Info] [Expanded Armory Grid - High Priority] [Right Compact Stats] */}
        <div
          style={{
            display: "flex",
            gap: "clamp(0.6rem, 1.2vw, 1.4rem)",
            width: "100%",
            alignItems: "stretch",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          {/* Left Panel: Player Identity & Economy (Sleek & Compact) */}
          <div
            style={{
              width: "clamp(10.5rem, 13vw, 14rem)",
              display: "flex",
              flexDirection: "column",
              gap: "0.45rem",
              flexShrink: 0,
              justifyContent: "flex-start",
            }}
          >
            {/* Player Identity */}
            <div
              style={{
                border: isAgentDetected
                  ? "1px solid rgba(255,255,255,0.18)"
                  : "1px solid rgba(245, 158, 11, 0.4)",
                padding: "clamp(0.5rem, 1vh, 0.8rem)",
                background: "rgba(16, 24, 38, 0.82)",
                display: "flex",
                gap: "0.7rem",
                alignItems: "center",
                backdropFilter: "blur(10px)",
                borderRadius: "0.3rem",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={myAgentIcon}
                  alt={myAgentName}
                  style={{
                    width: "clamp(2.3rem, 4.4vh, 3.2rem)",
                    height: "clamp(2.3rem, 4.4vh, 3.2rem)",
                    border: isAgentDetected
                      ? "1.5px solid rgba(255,255,255,0.25)"
                      : "1.5px solid var(--color-yellow)",
                    borderRadius: "0.25rem",
                    objectFit: "cover",
                  }}
                />
                {!isAgentDetected && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-3px",
                      right: "-3px",
                      background: "var(--color-yellow)",
                      color: "#000",
                      borderRadius: "50%",
                      width: "14px",
                      height: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      fontWeight: 900,
                    }}
                    title="Agente no detectado en vivo"
                  >
                    !
                  </div>
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontWeight: 900,
                    color: "var(--color-yellow)",
                    fontSize: "clamp(0.78rem, 1.1vw, 0.95rem)",
                    textTransform: "uppercase",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.04em",
                  }}
                >
                  {playerProfile?.gameName ? playerProfile.gameName : "PLAYER"}
                </div>

                {/* Status indicator: Shows whether agent is live or fallback demo */}
                {!isAgentDetected ? (
                  <div
                    style={{
                      fontSize: "clamp(0.48rem, 0.72vh, 0.58rem)",
                      color: "var(--color-yellow)",
                      fontWeight: 800,
                      marginTop: "0.15rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.2rem",
                      letterSpacing: "0.02em",
                    }}
                  >
                    <span style={{ fontSize: "0.55rem" }}>⚠️</span> NO DETECTADO (DEMO)
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "clamp(0.5rem, 0.75vh, 0.6rem)",
                      color: "var(--color-green)",
                      fontWeight: 800,
                      marginTop: "0.15rem",
                      textTransform: "uppercase",
                    }}
                  >
                    ● {myAgentName}
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem", alignItems: "center" }}>
                  {equippedArmorName ? (
                    <img
                      src={
                        ARMORS_DATA.find((a) => a.name === equippedArmorName)?.icon ||
                        "https://media.valorant-api.com/gear/822bcab2-40a2-324e-c137-e09195ad7692/displayicon.png"
                      }
                      alt={equippedArmorName}
                      style={{
                        width: "1rem",
                        height: "1rem",
                        objectFit: "contain",
                        flexShrink: 0,
                        filter: "drop-shadow(0 0 3px var(--color-cyan))",
                      }}
                      title={`Escudo Equipado: ${equippedArmorName}`}
                    />
                  ) : (
                    <div
                      style={{
                        width: "0.85rem",
                        height: "0.85rem",
                        border: "1.5px dashed rgba(255,255,255,0.4)",
                        borderRadius: "50%",
                        flexShrink: 0,
                      }}
                      title="Sin escudo equipado"
                    ></div>
                  )}
                  <img
                    src="https://media.valorant-api.com/weapons/29a0cfab-485b-f5d5-779a-b59f85e204a8/displayicon.png"
                    alt="Classic"
                    style={{ width: "1.2rem", height: "0.6rem", objectFit: "contain" }}
                  />
                </div>
              </div>
            </div>

            {/* Credits Box */}
            <div
              style={{
                background: "rgba(16, 24, 38, 0.82)",
                padding: "clamp(0.45rem, 0.95vh, 0.75rem) clamp(0.6rem, 1vw, 0.95rem)",
                display: "flex",
                justifyContent: "flex-end",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: "0.3rem",
                backdropFilter: "blur(10px)",
              }}
            >
              <span
                style={{
                  fontSize: "clamp(1.25rem, 2.3vh, 1.7rem)",
                  fontWeight: 900,
                  fontFamily: "'Orbitron', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span style={{ fontSize: "clamp(0.85rem, 1.4vh, 1.1rem)", color: "var(--color-cyan)" }}>
                  ¤
                </span>{" "}
                {myCredits.toLocaleString()}
              </span>
            </div>

            <div
              style={{
                fontSize: "clamp(0.52rem, 0.85vh, 0.65rem)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                margin: "0.25rem 0",
                fontWeight: 800,
                letterSpacing: "0.05em",
              }}
            >
              MÍN. PARA LA PRÓXIMA RONDA:{" "}
              <span style={{ float: "right", color: "var(--text-main)" }}>¤ 0</span>
            </div>
          </div>

          {/* Center Area: Expanded 5-Column Armory Grid (HIGH PRIORITY - MAX SPACE) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: "clamp(0.45rem, 0.9vw, 0.9rem)",
              flex: 1,
              minWidth: 0,
            }}
          >
            {renderWeaponCol([
              { title: "ARMAS DE MANO", id: "EEquippableCategory::Sidearm" },
            ])}
            {renderWeaponCol([
              { title: "SUBFUSILES", id: "EEquippableCategory::SMG" },
              { title: "ESCOPETAS", id: "EEquippableCategory::Shotgun" },
            ])}
            {renderWeaponCol([{ title: "RIFLES", id: "EEquippableCategory::Rifle" }])}
            {renderWeaponCol([
              {
                title: "FUSILES DE FRANCOTIRADOR",
                id: "EEquippableCategory::Sniper",
              },
              { title: "AMETRALLADORAS", id: "EEquippableCategory::Heavy" },
            ])}
            {renderArmorCol()}
          </div>

          {/* Right Panel: Compact Weapon Stats (LOWER PRIORITY - COMPACT DESIGN) */}
          <div
            style={{
              width: "clamp(11rem, 14vw, 15.5rem)",
              display: "flex",
              flexDirection: "column",
              background: "rgba(16, 24, 38, 0.85)",
              padding: "clamp(0.55rem, 1vh, 0.9rem)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "0.3rem",
              backdropFilter: "blur(10px)",
              overflowY: "auto",
              flexShrink: 0,
            }}
          >
            {hoveredWeapon ? (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.2rem",
                    borderBottom: "1px solid rgba(255,255,255,0.2)",
                    paddingBottom: "clamp(0.35rem, 0.7vh, 0.65rem)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: "clamp(0.85rem, 1.15vw, 1.05rem)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {hoveredWeapon.displayName.toUpperCase()}{" "}
                    <span
                      style={{
                        fontSize: "clamp(0.52rem, 0.8vh, 0.62rem)",
                        color: "var(--text-muted)",
                        fontWeight: 400,
                      }}
                    >
                      | {hoveredWeapon.shopData?.categoryText.toUpperCase()}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(0.52rem, 0.8vh, 0.62rem)",
                      color: "var(--text-muted)",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>DISPARO PRINCIPAL</span>
                    <span>Auto / Semiauto</span>
                  </div>
                </div>

                {hoveredWeapon.weaponStats ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "clamp(0.35rem, 0.7vh, 0.65rem)",
                      marginTop: "clamp(0.35rem, 0.7vh, 0.65rem)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <div
                        style={{
                          flex: 1,
                          borderTop: "2px solid var(--color-cyan)",
                          paddingTop: "0.2rem",
                        }}
                      >
                        <div style={{ fontSize: "clamp(0.45rem, 0.7vh, 0.52rem)", color: "var(--text-muted)" }}>
                          VELOCIDAD
                        </div>
                        <div style={{ fontSize: "clamp(0.75rem, 1.05vh, 0.88rem)", fontWeight: "bold" }}>
                          5.74 <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>M/S</span>
                        </div>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          borderTop: "2px solid var(--color-cyan)",
                          paddingTop: "0.2rem",
                        }}
                      >
                        <div style={{ fontSize: "clamp(0.45rem, 0.7vh, 0.52rem)", color: "var(--text-muted)" }}>
                          EQUIPAR
                        </div>
                        <div style={{ fontSize: "clamp(0.75rem, 1.05vh, 0.88rem)", fontWeight: "bold" }}>
                          {hoveredWeapon.weaponStats.equipTimeSeconds}{" "}
                          <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>S</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <div
                        style={{
                          flex: 1,
                          borderTop: "2px solid var(--color-cyan)",
                          paddingTop: "0.2rem",
                        }}
                      >
                        <div style={{ fontSize: "clamp(0.45rem, 0.7vh, 0.52rem)", color: "var(--text-muted)" }}>
                          RECARGA
                        </div>
                        <div style={{ fontSize: "clamp(0.75rem, 1.05vh, 0.88rem)", fontWeight: "bold" }}>
                          {hoveredWeapon.weaponStats.reloadTimeSeconds}{" "}
                          <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>S</span>
                        </div>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          borderTop: "2px solid rgba(255,255,255,0.2)",
                          paddingTop: "0.2rem",
                        }}
                      >
                        <div style={{ fontSize: "clamp(0.45rem, 0.7vh, 0.52rem)", color: "var(--text-muted)" }}>
                          CARGADOR
                        </div>
                        <div style={{ fontSize: "clamp(0.75rem, 1.05vh, 0.88rem)", fontWeight: "bold" }}>
                          {hoveredWeapon.weaponStats.magazineSize}{" "}
                          <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>BALAS</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <div
                        style={{
                          flex: 1,
                          borderTop: "2px solid var(--color-cyan)",
                          paddingTop: "0.2rem",
                        }}
                      >
                        <div style={{ fontSize: "clamp(0.45rem, 0.7vh, 0.52rem)", color: "var(--text-muted)" }}>
                          CADENCIA
                        </div>
                        <div style={{ fontSize: "clamp(0.75rem, 1.05vh, 0.88rem)", fontWeight: "bold" }}>
                          {hoveredWeapon.weaponStats.fireRate}{" "}
                          <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>B/S</span>
                        </div>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          borderTop: "2px solid rgba(255,255,255,0.2)",
                          paddingTop: "0.2rem",
                        }}
                      >
                        <div style={{ fontSize: "clamp(0.45rem, 0.7vh, 0.52rem)", color: "var(--text-muted)" }}>
                          DISPERSIÓN
                        </div>
                        <div style={{ fontSize: "clamp(0.75rem, 1.05vh, 0.88rem)", fontWeight: "bold" }}>
                          {hoveredWeapon.weaponStats.firstBulletAccuracy}{" "}
                          <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>MIRA</span>
                        </div>
                      </div>
                    </div>

                    {/* Damage Breakdown */}
                    <div style={{ marginTop: "0.35rem" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          paddingBottom: "0.2rem",
                          marginBottom: "0.35rem",
                        }}
                      >
                        <div style={{ fontSize: "clamp(0.55rem, 0.85vh, 0.65rem)", fontWeight: 900 }}>
                          DAÑO
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            fontSize: "clamp(0.45rem, 0.7vh, 0.52rem)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {hoveredWeapon.weaponStats.damageRanges.map((dr, idx) => (
                            <span key={idx}>
                              {dr.rangeStartMeters}-{dr.rangeEndMeters}m
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <div
                          style={{
                            width: "clamp(1.5rem, 3vh, 2rem)",
                            height: "clamp(2.4rem, 4.8vh, 3.2rem)",
                            border: "1px dashed var(--text-muted)",
                            position: "relative",
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: "10%",
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: "0.45rem",
                              height: "0.45rem",
                              borderRadius: "50%",
                              background: "white",
                            }}
                          ></div>
                          <div
                            style={{
                              position: "absolute",
                              top: "30%",
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: "0.75rem",
                              height: "0.95rem",
                              background: "white",
                            }}
                          ></div>
                          <div
                            style={{
                              position: "absolute",
                              top: "68%",
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: "0.45rem",
                              height: "0.65rem",
                              background: "white",
                            }}
                          ></div>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.15rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                            {hoveredWeapon.weaponStats.damageRanges.map((dr, idx) => (
                              <span
                                key={idx}
                                style={{ fontSize: "clamp(0.65rem, 0.95vh, 0.78rem)", fontWeight: "bold" }}
                              >
                                {dr.headDamage}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                            {hoveredWeapon.weaponStats.damageRanges.map((dr, idx) => (
                              <span
                                key={idx}
                                style={{ fontSize: "clamp(0.65rem, 0.95vh, 0.78rem)", fontWeight: "bold" }}
                              >
                                {dr.bodyDamage}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                            {hoveredWeapon.weaponStats.damageRanges.map((dr, idx) => (
                              <span
                                key={idx}
                                style={{ fontSize: "clamp(0.65rem, 0.95vh, 0.78rem)", fontWeight: "bold" }}
                              >
                                {dr.legDamage}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      marginTop: "0.8rem",
                    }}
                  >
                    Estadísticas no disponibles
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: "clamp(0.65rem, 0.95vh, 0.78rem)",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  lineHeight: "1.4",
                }}
              >
                Pasa el ratón sobre un arma
                <br />
                para ver sus estadísticas
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Abilities (Separated with clean breathing room - "un palmo") */}
        {basicAbilities.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.3rem",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: "clamp(0.58rem, 0.9vh, 0.7rem)",
                fontWeight: 900,
                letterSpacing: "0.15em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>HABILIDADES</span>
              {!isAgentDetected && (
                <span
                  style={{
                    fontSize: "clamp(0.48rem, 0.75vh, 0.58rem)",
                    color: "var(--color-yellow)",
                    fontWeight: 800,
                    padding: "1px 6px",
                    background: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    borderRadius: "3px",
                    letterSpacing: "0.04em",
                  }}
                >
                  ⚠️ NO DETECTADO (DEMO JETT)
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: "clamp(0.6rem, 1.4vw, 1.4rem)",
                width: "100%",
                maxWidth: "50rem",
                justifyContent: "center",
              }}
            >
              {basicAbilities.map((ab, idx) => {
                const abilityPriceData = getAbilityPrice(myAgentName, ab.displayName, ab.slot);
                const isSignature = abilityPriceData.isSignature;
                const cost = abilityPriceData.cost;

                // Unique key based on agent & slot/name
                const abilityKey = `${myAgentName}_${ab.displayName || ab.slot || idx}`;

                // Default status: signature abilities are 'owned', regular abilities start as 'buy' unless toggled
                const status: AbilityStatus =
                  abilityStatuses[abilityKey] || (isSignature ? "owned" : "buy");
                const isOwned = status === "owned";

                // Cost display: If owned, show "LLENA", if buy show cost (e.g. ¤150, ¤200, ¤250 or GRATIS)
                const costDisplay = isOwned
                  ? "LLENA"
                  : cost > 0
                    ? `¤${cost}`
                    : "GRATIS";

                // Status text / badge
                const statusLabel = isOwned ? "COMPRADO" : "NO COMPRADO";

                const cardStyle: React.CSSProperties = isOwned
                  ? {
                      flex: 1,
                      maxWidth: "16rem",
                      height: "clamp(3.1rem, 5.8vh, 4.2rem)",
                      background: "rgba(56, 189, 248, 0.12)",
                      border: "1.5px solid var(--color-cyan)",
                      display: "flex",
                      alignItems: "center",
                      padding: "clamp(0.3rem, 0.7vh, 0.55rem) clamp(0.55rem, 1.1vw, 0.95rem)",
                      position: "relative",
                      borderRadius: "0.25rem",
                      boxShadow: "0 0 14px rgba(56, 189, 248, 0.22)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }
                  : {
                      flex: 1,
                      maxWidth: "16rem",
                      height: "clamp(3.1rem, 5.8vh, 4.2rem)",
                      background: "rgba(16, 24, 38, 0.65)",
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                      display: "flex",
                      alignItems: "center",
                      padding: "clamp(0.3rem, 0.7vh, 0.55rem) clamp(0.55rem, 1.1vw, 0.95rem)",
                      position: "relative",
                      borderRadius: "0.25rem",
                      boxShadow: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    };

                return (
                  <div
                    key={idx}
                    onClick={() => toggleAbilityStatus(abilityKey)}
                    style={cardStyle}
                    onMouseOver={(e) => {
                      if (!isOwned) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isOwned) {
                        e.currentTarget.style.background = "rgba(16, 24, 38, 0.65)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
                      }
                    }}
                    title={`Click para alternar: ${statusLabel}`}
                  >
                    {/* Status Dot */}
                    <div
                      style={{
                        width: "0.45rem",
                        height: "0.45rem",
                        borderRadius: "50%",
                        background: isOwned ? "var(--color-yellow)" : "rgba(255, 255, 255, 0.25)",
                        marginRight: "clamp(0.45rem, 0.9vw, 0.8rem)",
                        flexShrink: 0,
                        boxShadow: isOwned ? "0 0 6px var(--color-yellow)" : "none",
                      }}
                    ></div>

                    {/* Icon */}
                    {ab.displayIcon && (
                      <img
                        src={ab.displayIcon}
                        alt={ab.displayName}
                        style={{
                          width: "clamp(1.7rem, 3.4vh, 2.5rem)",
                          height: "clamp(1.7rem, 3.4vh, 2.5rem)",
                          objectFit: "contain",
                          filter: isOwned
                            ? "drop-shadow(0 0 6px var(--color-cyan))"
                            : "grayscale(40%) opacity(0.65)",
                          flexShrink: 0,
                          transition: "filter 0.2s ease",
                        }}
                      />
                    )}

                    {/* Text block */}
                    <div style={{ marginLeft: "auto", textAlign: "right", minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "clamp(0.5rem, 0.8vh, 0.62rem)",
                          color: isOwned ? "var(--color-cyan)" : "var(--color-yellow)",
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                        }}
                      >
                        {costDisplay}
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(0.64rem, 1vh, 0.78rem)",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          color: isOwned ? "var(--text-main)" : "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ab.displayName}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
