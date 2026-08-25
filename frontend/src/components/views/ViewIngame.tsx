"use client";

import { useValorantData, Weapon } from "@/hooks/useValorantData";
import { useGameState } from "@/hooks/useGameState";
import { useState } from "react";

export default function ViewIngame() {
  const { agents, weapons } = useValorantData();
  const { myTeam, myCredits, buyPhaseAvailable } = useGameState();
  const [hoveredWeapon, setHoveredWeapon] = useState<Weapon | null>(null);

  const myAgentId = myTeam[0]?.agentId || "add6443a-41bd-e414-f6ad-e58d267f4e95"; // Jett UUID as fallback
  const myAgent = agents.find((a) => a.uuid.toLowerCase() === myAgentId.toLowerCase());
  const myAgentIcon =
    myAgent?.displayIcon ||
    "https://media.valorant-api.com/agents/add6443c-41c1-48b0-a04a-a71c8b3269a9/displayicon.png";
  const myAbilities = myAgent?.abilities || [];

  const basicAbilities = myAbilities.filter((a) => a.slot !== "Ultimate").slice(0, 3);

  const banditWeapon: Weapon = {
    uuid: "bandit-mock",
    displayName: "BANDIT",
    category: "EEquippableCategory::Sidearm",
    displayIcon:
      "https://media.valorant-api.com/weapons/44d4e95c-4157-0037-81b2-17841bf2e8e3/displayicon.png",
    shopData: { cost: 600, category: "Sidearms", categoryText: "Arma de Mano" },
    weaponStats: {
      fireRate: 8.5,
      magazineSize: 12,
      equipTimeSeconds: 0.75,
      reloadTimeSeconds: 1.8,
      firstBulletAccuracy: 0.8,
      damageRanges: [
        { rangeStartMeters: 0, rangeEndMeters: 30, headDamage: 110, bodyDamage: 35, legDamage: 29 },
        { rangeStartMeters: 30, rangeEndMeters: 50, headDamage: 90, bodyDamage: 30, legDamage: 25 },
      ],
    },
  };

  // Deduplicate weapons by displayName to avoid duplicated items
  const weaponMap = new Map<string, Weapon>();
  weapons.forEach((w) => weaponMap.set(w.displayName.toUpperCase(), w));
  if (!weaponMap.has("BANDIT")) {
    weaponMap.set("BANDIT", banditWeapon);
  }
  const allWeapons = Array.from(weaponMap.values());

  const getWeaponStatus = (wName: string, cost: number) => {
    if (cost > myCredits) return "unaffordable";
    return "affordable";
  };

  const renderWeaponCol = (categories: { title: string; id: string }[]) => {
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
          const groupWeapons = allWeapons.filter(
            (w) => w.category === cat.id && w.shopData,
          );

          const exactOrder = [
            "CLASSIC",
            "SHORTY",
            "FRENZY",
            "GHOST",
            "BANDIT",
            "SHERIFF", // Sidearms
            "STINGER",
            "SPECTRE", // SMGs
            "BUCKY",
            "JUDGE", // Shotguns
            "BULLDOG",
            "GUARDIAN",
            "PHANTOM",
            "VANDAL", // Rifles
            "MARSHAL",
            "OUTLAW",
            "OPERATOR", // Snipers
            "ARES",
            "ODIN", // Heavy
          ];

          groupWeapons.sort((a, b) => {
            const indexA = exactOrder.indexOf(a.displayName.toUpperCase());
            const indexB = exactOrder.indexOf(b.displayName.toUpperCase());

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return (a.shopData?.cost || 0) - (b.shopData?.cost || 0);
          });

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
                const status = getWeaponStatus(w.displayName, w.shopData.cost);

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
    const armors = [
      {
        name: "ARM. LIGERA",
        cost: 400,
        icon: "https://media.valorant-api.com/gear/4dec83d5-4902-9ab3-bed6-a7a390761157/displayicon.png",
      },
      {
        name: "ESCUDO REGEN.",
        cost: 650,
        icon: "https://media.valorant-api.com/gear/b1b9086d-41bd-a516-5d29-e3b34a6f1644/displayicon.png",
      },
      {
        name: "ARM. PESADA",
        cost: 1000,
        icon: "https://media.valorant-api.com/gear/822bcab2-40a2-324e-c137-e09195ad7692/displayicon.png",
      },
    ];

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
          {armors.map((a) => {
            const status = myCredits >= a.cost ? "affordable" : "unaffordable";
            const color = status === "unaffordable" ? "var(--color-red)" : "#f8fafc";

            return (
              <div
                key={a.name}
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  background: "rgba(16, 24, 38, 0.72)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  cursor: "pointer",
                  height: "clamp(5.8rem, 10.8vh, 8.5rem)",
                  borderRadius: "0.25rem",
                  transition: "all 0.15s ease",
                  backdropFilter: "blur(6px)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)";
                  e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.45)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(16, 24, 38, 0.72)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
                }}
              >
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
                <div
                  style={{
                    position: "absolute",
                    bottom: "0.3rem",
                    right: "0.5rem",
                    fontSize: "clamp(0.62rem, 1vh, 0.78rem)",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    color: "#f8fafc",
                    zIndex: 2,
                  }}
                >
                  {a.name}
                </div>
                <img
                  src={a.icon}
                  alt={a.name}
                  style={{
                    maxHeight: "clamp(2.6rem, 5vh, 4rem)",
                    maxWidth: "60%",
                    objectFit: "contain",
                    filter:
                      status === "unaffordable" ? "grayscale(100%) opacity(0.6)" : "none",
                    position: "absolute",
                    top: "40%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 1,
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
        background:
          "url(https://media.valorant-api.com/maps/7eae2e51-4ece-f12b-57fc-92b2dd29d3c4/splash.png) center center / cover no-repeat",
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
              width: "clamp(10rem, 12vw, 13.5rem)",
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
                border: "1px solid rgba(255,255,255,0.18)",
                padding: "clamp(0.5rem, 1vh, 0.8rem)",
                background: "rgba(16, 24, 38, 0.82)",
                display: "flex",
                gap: "0.7rem",
                alignItems: "center",
                backdropFilter: "blur(10px)",
                borderRadius: "0.3rem",
              }}
            >
              <img
                src={myAgentIcon}
                alt="Agent"
                style={{
                  width: "clamp(2.3rem, 4.4vh, 3.2rem)",
                  height: "clamp(2.3rem, 4.4vh, 3.2rem)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  borderRadius: "0.25rem",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
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
                  shumi747
                </div>
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem", alignItems: "center" }}>
                  <div
                    style={{
                      width: "0.85rem",
                      height: "0.85rem",
                      border: "1.5px solid rgba(255,255,255,0.6)",
                      borderRadius: "50%",
                      flexShrink: 0,
                    }}
                  ></div>
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
              }}
            >
              HABILIDADES
            </div>
            <div
              style={{
                display: "flex",
                gap: "clamp(0.6rem, 1.4vw, 1.4rem)",
                width: "100%",
                maxWidth: "48rem",
                justifyContent: "center",
              }}
            >
              {basicAbilities.map((ab, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    maxWidth: "15rem",
                    height: "clamp(3rem, 5.5vh, 4rem)",
                    background: "rgba(56, 189, 248, 0.09)",
                    border: "1.5px solid var(--color-cyan)",
                    display: "flex",
                    alignItems: "center",
                    padding: "clamp(0.3rem, 0.7vh, 0.55rem) clamp(0.55rem, 1.1vw, 0.9rem)",
                    position: "relative",
                    borderRadius: "0.25rem",
                    boxShadow: "0 0 12px rgba(56, 189, 248, 0.15)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "0.4rem",
                      height: "0.4rem",
                      borderRadius: "50%",
                      background: "var(--color-yellow)",
                      marginRight: "clamp(0.45rem, 0.9vw, 0.8rem)",
                      flexShrink: 0,
                    }}
                  ></div>
                  {ab.displayIcon && (
                    <img
                      src={ab.displayIcon}
                      alt={ab.displayName}
                      style={{
                        width: "clamp(1.6rem, 3.2vh, 2.4rem)",
                        height: "clamp(1.6rem, 3.2vh, 2.4rem)",
                        objectFit: "contain",
                        filter: "drop-shadow(0 0 5px var(--color-cyan))",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ marginLeft: "auto", textAlign: "right", minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "clamp(0.48rem, 0.75vh, 0.58rem)",
                        color: "var(--color-cyan)",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                      }}
                    >
                      LLENA
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(0.64rem, 1vh, 0.78rem)",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        color: "var(--text-main)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ab.displayName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
