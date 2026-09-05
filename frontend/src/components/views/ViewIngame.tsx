"use client";

import { useValorantData, Weapon } from "@/hooks/useValorantData";
import { useGameState } from "@/hooks/useGameState";
import { getMapSplash } from "@/data/mapsData";
import { calculateNextRoundProjection } from "@/data/economyEngine";
import AbilitiesShop from "@/components/shop/AbilitiesShop";
import {
  ARMORS_DATA,
  WeaponCategoryConfig,
  getProcessedWeapons,
  getCategoryWeapons,
  getWeaponAffordability,
} from "@/data/weaponsData";
import {
  resolveAiRecommendation,
  computeToggleArmor,
  computeNextAbilityCharge,
  calculateManualSidearmSpend,
  calculateManualPrimarySpend,
  calculateManualArmorSpend,
  calculateManualAbilitiesSpend,
  calculateTotalSpend,
} from "@/lib/ingameLogic";
import { useState, useMemo, useCallback, useEffect } from "react";

// Estado de compra de cada habilidad: 'owned' (ya comprada/en posesión) o 'buy' (disponible para comprar)
export type AbilityStatus = "owned" | "buy";

export default function ViewIngame() {
  // 1. Hook para obtener datos estáticos (agentes, catálogo de armas de Riot API)
  const { agents, weapons: rawWeapons } = useValorantData();

  // 2. Hook del estado en tiempo real del juego (equipo, créditos actuales, fase de compra, mapa detectado, economía)
  const {
    myTeam,
    myCredits,
    buyPhaseAvailable,
    selectedMap,
    playerProfile,
    lossStreak,
    buyRecommendations,
    isFollowingAiRecommendation,
    setIsFollowingAiRecommendation,
    setPlannedSpend,
  } = useGameState();

  // 3. Estado local para saber qué arma tiene el cursor encima (hover) y mostrar sus estadísticas
  const [hoveredWeapon, setHoveredWeapon] = useState<Weapon | null>(null);

  // 4. Detección del agente del jugador actual ("You" en vivo o el agente seleccionado)
  const myPlayer = myTeam.find((p) => p.name === "You") || myTeam.find((p) => p.agentId) || myTeam[0];
  const rawAgentId = myPlayer?.agentId;
  const isAgentDetected = Boolean(rawAgentId && rawAgentId.trim() !== "");
  // Si estamos en modo demo (sin juego abierto ni agente seleccionado), usamos el UUID de Jett por defecto
  const myAgentId = isAgentDetected && rawAgentId ? rawAgentId : "add6443a-41bd-e414-f6ad-e58d267f4e95";

  // useMemo: Busca al agente en la lista solo si 'agents' o 'myAgentId' cambian.
  const myAgent = useMemo(() => {
    return agents.find((a) => a.uuid.toLowerCase() === myAgentId.toLowerCase());
  }, [agents, myAgentId]);

  const myAgentName = myAgent?.displayName || "Jett";
  const myAgentIcon =
    myAgent?.displayIcon ||
    "https://media.valorant-api.com/agents/add6443c-41c1-48b0-a04a-a71c8b3269a9/displayicon.png";
  const myAbilities = useMemo(() => myAgent?.abilities || [], [myAgent]);

  // useMemo: Filtra las 3 habilidades básicas (excluyendo la Ultimate que no se compra en tienda)
  const basicAbilities = useMemo(() => {
    return myAbilities.filter((a) => a.slot !== "Ultimate").slice(0, 3);
  }, [myAbilities]);

  // useState: Diccionario para registrar las cargas de cada habilidad (soporte multicargas)
  const [abilityChargesState, setAbilityChargesState] = useState<Record<string, number>>({});

  // useMemo: Procesa, ordena y desduplica el catálogo de armas de la tienda
  const allWeapons = useMemo(() => getProcessedWeapons(rawWeapons), [rawWeapons]);

  // useMemo: Equipamiento derivado directamente de la recomendación de la IA (puro, sin efectos secundarios)
  const aiEquipped = useMemo(() => {
    if (!buyRecommendations) {
      return { sidearmName: "Classic", primaryName: null as string | null, armorName: null as string | null };
    }
    return resolveAiRecommendation(buyRecommendations, allWeapons);
  }, [buyRecommendations, allWeapons]);

  // Estados locales para cuando el usuario realiza una compra manual o sobrescribe la IA
  const [manualSidearmName, setManualSidearmName] = useState<string | null>(null);
  const [manualPrimaryName, setManualPrimaryName] = useState<string | null>(null);
  const [manualArmorName, setManualArmorName] = useState<string | null>(null);

  // Equipamiento efectivo según si el usuario sigue la IA o ha elegido manualmente
  const equippedSidearmName = isFollowingAiRecommendation
    ? aiEquipped.sidearmName
    : (manualSidearmName ?? aiEquipped.sidearmName ?? "Classic");

  const equippedPrimaryName = isFollowingAiRecommendation
    ? aiEquipped.primaryName
    : (manualPrimaryName !== undefined && manualPrimaryName !== null ? manualPrimaryName : aiEquipped.primaryName);

  const equippedArmorName = isFollowingAiRecommendation
    ? aiEquipped.armorName
    : (manualArmorName !== undefined && manualArmorName !== null ? manualArmorName : aiEquipped.armorName);

  // useCallback: Función memorizada para alternar armas de forma independiente (pistola y arma larga)
  const toggleWeapon = useCallback((weapon: Weapon) => {
    setIsFollowingAiRecommendation(false);
    const isSidearm = weapon.category === "EEquippableCategory::Sidearm";
    if (isSidearm) {
      setManualSidearmName((current) => {
        const effective = current ?? equippedSidearmName;
        return effective.toUpperCase() === weapon.displayName.toUpperCase() ? "Classic" : weapon.displayName;
      });
    } else {
      setManualPrimaryName((current) => {
        const effective = current ?? equippedPrimaryName;
        return effective && effective.toUpperCase() === weapon.displayName.toUpperCase()
          ? null
          : weapon.displayName;
      });
    }
  }, [setIsFollowingAiRecommendation, equippedSidearmName, equippedPrimaryName]);

  // useCallback: Función memorizada para alternar/ciclar cargas de una habilidad
  const handleToggleAbilityCharge = useCallback(
    (abilityId: string, maxCharges: number, defaultCharges: number) => {
      setAbilityChargesState((prev) => ({
        ...prev,
        [abilityId]: computeNextAbilityCharge(prev[abilityId], maxCharges, defaultCharges),
      }));
      setIsFollowingAiRecommendation(false);
    },
    [setIsFollowingAiRecommendation]
  );

  // useCallback: Función memorizada para equipar/desequipar un escudo al hacer clic
  const toggleArmor = useCallback((armorName: string) => {
    setIsFollowingAiRecommendation(false);
    setManualArmorName((current) => {
      const effective = current ?? equippedArmorName;
      return computeToggleArmor(effective, armorName);
    });
  }, [setIsFollowingAiRecommendation, equippedArmorName]);

  // useMemo: Arma activa para inspeccionar (si hay hover muestra la del hover; si no, muestra el arma principal o pistola equipada, o Vandal por defecto)
  const activeWeaponToInspect = useMemo(() => {
    if (hoveredWeapon) return hoveredWeapon;
    if (equippedPrimaryName) {
      const p = allWeapons.find(
        (w) => w.displayName.toUpperCase() === equippedPrimaryName.toUpperCase()
      );
      if (p) return p;
    }
    if (equippedSidearmName) {
      const s = allWeapons.find(
        (w) => w.displayName.toUpperCase() === equippedSidearmName.toUpperCase()
      );
      if (s) return s;
    }
    return (
      allWeapons.find((w) => w.displayName.toUpperCase() === "VANDAL") ||
      allWeapons[0] ||
      null
    );
  }, [hoveredWeapon, equippedPrimaryName, equippedSidearmName, allWeapons]);

  // Cálculo dinámico del gasto en armamento, blindaje y habilidades
  const manualSidearmSpend = useMemo(
    () => calculateManualSidearmSpend(equippedSidearmName, allWeapons),
    [equippedSidearmName, allWeapons]
  );

  const manualPrimarySpend = useMemo(
    () => calculateManualPrimarySpend(equippedPrimaryName, allWeapons),
    [equippedPrimaryName, allWeapons]
  );

  const manualWeaponSpend = useMemo(
    () => manualSidearmSpend + manualPrimarySpend,
    [manualSidearmSpend, manualPrimarySpend]
  );

  const manualArmorSpend = useMemo(
    () => calculateManualArmorSpend(equippedArmorName),
    [equippedArmorName]
  );

  const manualAbilitiesSpend = useMemo(
    () => calculateManualAbilitiesSpend(myAgentName, abilityChargesState),
    [myAgentName, abilityChargesState]
  );

  const totalCalculatedSpend = useMemo(
    () =>
      calculateTotalSpend({
        isFollowingAiRecommendation,
        buyRecommendations,
        manualWeaponSpend,
        manualArmorSpend,
        manualAbilitiesSpend,
      }),
    [
      isFollowingAiRecommendation,
      buyRecommendations,
      manualWeaponSpend,
      manualArmorSpend,
      manualAbilitiesSpend,
    ]
  );

  // Sincronizar el gasto planeado con el contexto de GameState para el cálculo automático de fin de ronda
  useEffect(() => {
    setPlannedSpend(totalCalculatedSpend);
  }, [totalCalculatedSpend, setPlannedSpend]);

  // Proyección de la economía para la siguiente ronda (Mínimo garantizado por derrota vs ganancia por victoria)
  const projection = useMemo(() => {
    return calculateNextRoundProjection(myCredits, totalCalculatedSpend, lossStreak);
  }, [myCredits, totalCalculatedSpend, lossStreak]);

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
                const isSidearm = w.category === "EEquippableCategory::Sidearm";
                const isEquipped = isSidearm
                  ? equippedSidearmName.toUpperCase() === w.displayName.toUpperCase()
                  : Boolean(equippedPrimaryName && equippedPrimaryName.toUpperCase() === w.displayName.toUpperCase());
                const status = getWeaponAffordability(w.shopData.cost, myCredits);

                const border = isEquipped
                  ? "1.5px solid var(--color-cyan)"
                  : "1px solid rgba(255, 255, 255, 0.16)";
                const bg = isEquipped
                  ? "rgba(56, 189, 248, 0.14)"
                  : "rgba(16, 24, 38, 0.72)";
                const shadow = isEquipped
                  ? "0 0 14px rgba(56, 189, 248, 0.25)"
                  : "none";
                const color = status === "unaffordable" && !isEquipped ? "var(--color-red)" : "#f8fafc";

                const isClassic = w.displayName.toUpperCase() === "CLASSIC";
                const costDisplay = isClassic ? "GRATIS" : `¤${w.shopData.cost}`;
                const nameDisplay = w.displayName;
                const statusLabel = isEquipped ? "COMPRADO" : "";

                return (
                  <div
                    key={w.uuid}
                    onClick={() => toggleWeapon(w)}
                    onMouseEnter={() => setHoveredWeapon(w)}
                    onMouseLeave={() => setHoveredWeapon(null)}
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
                      height: "clamp(2.8rem, 5.2vh, 4.2rem)",
                      transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                      borderRadius: "0.25rem",
                      backdropFilter: "blur(6px)",
                    }}
                    onMouseOver={(e) => {
                      if (!isEquipped) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)";
                        e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.45)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isEquipped) {
                        e.currentTarget.style.background = bg;
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
                      }
                    }}
                    title={
                      isEquipped
                        ? isSidearm
                          ? isClassic
                            ? `Pistola por defecto: ${w.displayName}`
                            : `Click para desequipar (volver a Classic): ${w.displayName}`
                          : `Click para desequipar arma larga: ${w.displayName}`
                        : `Click para equipar: ${w.displayName}`
                    }
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
                    NO DETECTADO (DEMO)
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
                  {/* Escudo */}
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

                  {/* Pistola */}
                  <img
                    src={
                      allWeapons.find((w) => w.displayName.toUpperCase() === equippedSidearmName.toUpperCase())?.displayIcon ||
                      "https://media.valorant-api.com/weapons/29a0cfab-485b-f5d5-779a-b59f85e204a8/displayicon.png"
                    }
                    alt={equippedSidearmName}
                    style={{ width: "1.2rem", height: "0.65rem", objectFit: "contain", flexShrink: 0 }}
                    title={`Pistola: ${equippedSidearmName}`}
                  />

                  {/* Arma Larga */}
                  {equippedPrimaryName ? (
                    <img
                      src={
                        allWeapons.find((w) => w.displayName.toUpperCase() === equippedPrimaryName.toUpperCase())?.displayIcon ||
                        "https://media.valorant-api.com/weapons/ee8fa195-4c50-3da8-064f-b880714f7041/displayicon.png"
                      }
                      alt={equippedPrimaryName}
                      style={{ width: "1.6rem", height: "0.65rem", objectFit: "contain", flexShrink: 0 }}
                      title={`Arma larga: ${equippedPrimaryName}`}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: "0.45rem",
                        color: "var(--text-dim)",
                        border: "1px dashed rgba(255,255,255,0.2)",
                        borderRadius: "2px",
                        padding: "0 0.2rem",
                        height: "0.65rem",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                        fontWeight: 700,
                      }}
                      title="Sin arma larga equipada"
                    >
                      ARMA LARGA
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selector de Modo de Compra (Seguir IA vs Compra Manual) */}
            <div
              onClick={() => setIsFollowingAiRecommendation(!isFollowingAiRecommendation)}
              style={{
                background: isFollowingAiRecommendation
                  ? "linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(16, 24, 38, 0.88))"
                  : "rgba(16, 24, 38, 0.82)",
                border: isFollowingAiRecommendation
                  ? "1.5px solid var(--color-cyan)"
                  : "1px solid rgba(255, 255, 255, 0.18)",
                padding: "clamp(0.45rem, 0.85vh, 0.65rem)",
                borderRadius: "0.3rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                backdropFilter: "blur(8px)",
              }}
              title="Click para alternar entre seguir la recomendación de la IA o compra manual"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "clamp(0.52rem, 0.85vh, 0.65rem)",
                    fontWeight: 900,
                    letterSpacing: "0.05em",
                    color: isFollowingAiRecommendation ? "var(--color-cyan)" : "#cbd5e1",
                    textTransform: "uppercase",
                  }}
                >
                  {isFollowingAiRecommendation ? "RECOMENDACIÓN IA" : "COMPRA MANUAL"}
                </span>
                <span
                  style={{
                    fontSize: "clamp(0.48rem, 0.72vh, 0.58rem)",
                    fontWeight: 800,
                    padding: "1px 5px",
                    borderRadius: "3px",
                    background: isFollowingAiRecommendation ? "var(--color-cyan)" : "rgba(255,255,255,0.12)",
                    color: isFollowingAiRecommendation ? "#000" : "#94a3b8",
                  }}
                >
                  {isFollowingAiRecommendation ? "SEGUIDA" : "EDITAR"}
                </span>
              </div>

              {buyRecommendations && (
                <div
                  style={{
                    fontSize: "clamp(0.5rem, 0.76vh, 0.6rem)",
                    color: "var(--text-muted)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    marginTop: "2px",
                  }}
                >
                  <div>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>Plan IA:</span>{" "}
                    {buyRecommendations.weapon || "Save"} + {buyRecommendations.shield || "Sin escudo"}
                  </div>
                  <div style={{ color: "var(--color-cyan)", fontWeight: 800 }}>
                    Coste estimado: ¤ {buyRecommendations.cost?.toLocaleString() || 0}
                  </div>
                </div>
              )}
            </div>

            {/* Credits Box con desglose dinámico */}
            <div
              style={{
                background: "rgba(16, 24, 38, 0.82)",
                padding: "clamp(0.45rem, 0.85vh, 0.7rem) clamp(0.6rem, 1vw, 0.85rem)",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: "0.3rem",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "clamp(0.52rem, 0.8vh, 0.62rem)", color: "var(--text-muted)", fontWeight: 800 }}>
                  CRÉDITOS BANCO
                </span>
                <span
                  style={{
                    fontSize: "clamp(1.15rem, 2.1vh, 1.55rem)",
                    fontWeight: 900,
                    fontFamily: "'Orbitron', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <span style={{ fontSize: "clamp(0.8rem, 1.3vh, 1rem)", color: "var(--color-cyan)" }}>
                    ¤
                  </span>{" "}
                  {myCredits.toLocaleString()}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "clamp(0.5rem, 0.78vh, 0.62rem)",
                  fontWeight: 800,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: "0.25rem",
                }}
              >
                <span style={{ color: "var(--color-red)" }}>
                  Gasto: -¤ {totalCalculatedSpend.toLocaleString()}
                </span>
                <span style={{ color: "var(--color-green)" }}>
                  Restante: ¤ {projection.leftoverCredits.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Proyecciones de la Próxima Ronda */}
            <div
              style={{
                background: "rgba(16, 24, 38, 0.6)",
                padding: "clamp(0.35rem, 0.7vh, 0.5rem) clamp(0.5rem, 0.9vw, 0.75rem)",
                borderRadius: "0.25rem",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(0.5rem, 0.8vh, 0.62rem)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>MÍN. PRÓXIMA RONDA:</span>
                <span style={{ color: "var(--text-main)", fontWeight: 900 }}>
                  ¤ {projection.minNextRoundLoss.toLocaleString()}
                </span>
              </div>

              <div
                style={{
                  fontSize: "clamp(0.48rem, 0.75vh, 0.58rem)",
                  color: "rgba(255,255,255,0.55)",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>SI GANAS LA RONDA:</span>
                <span style={{ color: "var(--color-cyan)", fontWeight: 800 }}>
                  ¤ {projection.minNextRoundWin.toLocaleString()}
                </span>
              </div>
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

          {/* Right Panel: Responsive Weapon Stats & Damage Card */}
          <div
            style={{
              width: "clamp(12.5rem, 16vw, 17.5rem)",
              display: "flex",
              flexDirection: "column",
              background: "rgba(16, 24, 38, 0.88)",
              padding: "0.75rem 0.85rem",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "0.35rem",
              backdropFilter: "blur(12px)",
              boxSizing: "border-box",
              flexShrink: 0,
              height: "100%",
            }}
          >
            {activeWeaponToInspect ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                {/* Header Section */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.18)",
                    paddingBottom: "0.45rem",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: "1.1rem",
                      letterSpacing: "0.04em",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      color: "#FFFFFF",
                    }}
                  >
                    {activeWeaponToInspect.displayName.toUpperCase()}
                    <span
                      style={{
                        fontSize: "0.62rem",
                        color: "var(--text-muted)",
                        fontWeight: 700,
                        background: "rgba(255,255,255,0.06)",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "0.2rem",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {activeWeaponToInspect.shopData?.categoryText.toUpperCase() || "ARMA"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  >
                    <span>DISPARO PRINCIPAL</span>
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>Auto / Semiauto</span>
                  </div>
                </div>

                {activeWeaponToInspect.weaponStats ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      justifyContent: "space-between",
                      gap: "0.5rem",
                    }}
                  >
                    {/* Stat Tiles Grid (2x3) */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.4rem",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "0.25rem",
                          padding: "0.35rem 0.5rem",
                        }}
                      >
                        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.06em" }}>
                          VELOCIDAD
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#F8FAFC" }}>
                          5.74 <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 700 }}>M/S</span>
                        </div>
                      </div>

                      <div
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "0.25rem",
                          padding: "0.35rem 0.5rem",
                        }}
                      >
                        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.06em" }}>
                          EQUIPAR
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#F8FAFC" }}>
                          {activeWeaponToInspect.weaponStats.equipTimeSeconds}{" "}
                          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 700 }}>S</span>
                        </div>
                      </div>

                      <div
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "0.25rem",
                          padding: "0.35rem 0.5rem",
                        }}
                      >
                        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.06em" }}>
                          RECARGA
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#F8FAFC" }}>
                          {activeWeaponToInspect.weaponStats.reloadTimeSeconds}{" "}
                          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 700 }}>S</span>
                        </div>
                      </div>

                      <div
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "0.25rem",
                          padding: "0.35rem 0.5rem",
                        }}
                      >
                        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.06em" }}>
                          CARGADOR
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#F8FAFC" }}>
                          {activeWeaponToInspect.weaponStats.magazineSize}{" "}
                          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 700 }}>BALAS</span>
                        </div>
                      </div>

                      <div
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "0.25rem",
                          padding: "0.35rem 0.5rem",
                        }}
                      >
                        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.06em" }}>
                          CADENCIA
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#F8FAFC" }}>
                          {activeWeaponToInspect.weaponStats.fireRate}{" "}
                          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 700 }}>B/S</span>
                        </div>
                      </div>

                      <div
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "0.25rem",
                          padding: "0.35rem 0.5rem",
                        }}
                      >
                        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.06em" }}>
                          DISPERSIÓN
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#F8FAFC" }}>
                          {activeWeaponToInspect.weaponStats.firstBulletAccuracy}{" "}
                          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 700 }}>MIRA</span>
                        </div>
                      </div>
                    </div>

                    {/* Damage Breakdown Section - Fills the rest of the height cleanly */}
                    {activeWeaponToInspect.weaponStats.damageRanges &&
                      activeWeaponToInspect.weaponStats.damageRanges.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            justifyContent: "space-between",
                            background: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "0.3rem",
                            padding: "0.45rem 0.55rem",
                            boxSizing: "border-box",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderBottom: "1px solid rgba(255,255,255,0.12)",
                              paddingBottom: "0.25rem",
                            }}
                          >
                            <div style={{ fontSize: "clamp(0.62rem, 0.85vw, 0.72rem)", fontWeight: 900, letterSpacing: "0.08em", color: "#FFFFFF" }}>
                              DAÑO
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "0.4rem",
                                fontSize: "clamp(0.5rem, 0.72vw, 0.58rem)",
                                fontWeight: 700,
                                color: "var(--text-muted)",
                              }}
                            >
                              {activeWeaponToInspect.weaponStats.damageRanges.map((dr, idx) => (
                                <span key={idx} style={{ minWidth: "2.2rem", textAlign: "right" }}>
                                  {dr.rangeStartMeters}-{dr.rangeEndMeters}m
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Dummy and Damage Rows - Expanded & Perfectly Aligned */}
                          <div
                            style={{
                              display: "flex",
                              gap: "0.55rem",
                              alignItems: "stretch",
                              flex: 1,
                              marginTop: "0.35rem",
                              minHeight: "5.5rem",
                              minWidth: 0,
                            }}
                          >
                            {/* Tactical Target Dummy Silhouette Box */}
                            <div
                              style={{
                                width: "clamp(2rem, 3.2vw, 2.6rem)",
                                background: "rgba(0, 0, 0, 0.25)",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                borderRadius: "0.3rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0.35rem 0.25rem",
                                boxSizing: "border-box",
                                flexShrink: 0,
                                boxShadow: "inset 0 0 8px rgba(0, 0, 0, 0.4)",
                              }}
                            >
                              <svg
                                viewBox="0 0 28 56"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  maxHeight: "7rem",
                                  display: "block",
                                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
                                }}
                              >
                                {/* Head Zone */}
                                <path
                                  d="M14 2.5 C17.2 2.5 19.5 4.8 19.5 8 C19.5 10.7 17.6 12.9 15.2 13.5 L15.2 14.8 L12.8 14.8 L12.8 13.5 C10.4 12.9 8.5 10.7 8.5 8 C8.5 4.8 10.8 2.5 14 2.5 Z"
                                  fill="#FFFFFF"
                                />
                                {/* Torso / Body Zone */}
                                <path
                                  d="M10.5 17.5 L17.5 17.5 C19.5 17.5 21.2 18.5 22 20.2 L23.5 23.5 C23.9 24.4 23.6 25.5 22.8 26 L20 27.8 L18.5 34 C18.3 34.6 17.7 35 17 35 L11 35 C10.3 35 9.7 34.6 9.5 34 L8 27.8 L5.2 26 C4.4 25.5 4.1 24.4 4.5 23.5 L6 20.2 C6.8 18.5 8.5 17.5 10.5 17.5 Z"
                                  fill="#ECE8E1"
                                />
                                {/* Legs Zone */}
                                <path
                                  d="M9.5 37.5 L18.5 37.5 C19.6 37.5 20.5 38.3 20.8 39.4 L22 46.5 L21.5 53 C21.4 54.1 20.5 55 19.4 55 L16.6 55 C15.5 55 14.6 54.2 14.5 53.1 L14.1 46 L13.9 46 L13.5 53.1 C13.4 54.2 12.5 55 11.4 55 L8.6 55 C7.5 55 6.6 54.1 6.5 53 L6 46.5 L7.2 39.4 C7.5 38.3 8.4 37.5 9.5 37.5 Z"
                                  fill="#94A3B8"
                                />
                              </svg>
                            </div>

                            {/* Damage Numbers Columns (100% aligned with header columns) */}
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                padding: "0.15rem 0",
                                boxSizing: "border-box",
                                minWidth: 0,
                              }}
                            >
                              {/* Head Damage Row */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: "0.4rem",
                                  alignItems: "center",
                                }}
                              >
                                {activeWeaponToInspect.weaponStats.damageRanges.map((dr, idx) => {
                                  const val = Number.isInteger(dr.headDamage)
                                    ? dr.headDamage
                                    : Math.round(dr.headDamage * 10) / 10;
                                  return (
                                    <span
                                      key={idx}
                                      style={{
                                        minWidth: "2.2rem",
                                        textAlign: "right",
                                        fontSize: "clamp(0.92rem, 1.25vw, 1.2rem)",
                                        fontWeight: 900,
                                        color: "#FFFFFF",
                                        letterSpacing: "0.02em",
                                      }}
                                    >
                                      {val}
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Body Damage Row */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: "0.4rem",
                                  alignItems: "center",
                                }}
                              >
                                {activeWeaponToInspect.weaponStats.damageRanges.map((dr, idx) => {
                                  const val = Number.isInteger(dr.bodyDamage)
                                    ? dr.bodyDamage
                                    : Math.round(dr.bodyDamage * 10) / 10;
                                  return (
                                    <span
                                      key={idx}
                                      style={{
                                        minWidth: "2.2rem",
                                        textAlign: "right",
                                        fontSize: "clamp(0.85rem, 1.15vw, 1.1rem)",
                                        fontWeight: 800,
                                        color: "#ECE8E1",
                                        letterSpacing: "0.02em",
                                      }}
                                    >
                                      {val}
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Leg Damage Row */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: "0.4rem",
                                  alignItems: "center",
                                }}
                              >
                                {activeWeaponToInspect.weaponStats.damageRanges.map((dr, idx) => {
                                  const val = Number.isInteger(dr.legDamage)
                                    ? dr.legDamage
                                    : Math.round(dr.legDamage * 10) / 10;
                                  return (
                                    <span
                                      key={idx}
                                      style={{
                                        minWidth: "2.2rem",
                                        textAlign: "right",
                                        fontSize: "clamp(0.8rem, 1.05vw, 1.02rem)",
                                        fontWeight: 700,
                                        color: "#94A3B8",
                                        letterSpacing: "0.02em",
                                      }}
                                    >
                                      {val}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: "0.8rem",
                      textAlign: "center",
                    }}
                  >
                    Estadísticas no disponibles
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: "0.78rem",
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
          <AbilitiesShop
            agentName={myAgentName}
            apiAbilities={myAbilities}
            isAgentDetected={isAgentDetected}
            chargesState={abilityChargesState}
            onToggleCharge={handleToggleAbilityCharge}
          />
        )}
      </div>
    </div>
  );
}
