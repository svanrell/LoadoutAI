"use client";

import React, { useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  AGENT_ABILITIES_DATABASE,
  DEFAULT_FALLBACK_ABILITIES,
  AgentAbilityDetail,
  AbilityPosition,
  AbilitySlot,
  resolveAgentShopAbilities,
  ResolvedShopAbility,
} from "@/data/agentAbilitiesData";

// Re-exportar tipos para conveniencia de otros componentes
export type { AbilityPosition, AbilitySlot, AgentAbilityDetail, ResolvedShopAbility };
export { AGENT_ABILITIES_DATABASE, DEFAULT_FALLBACK_ABILITIES };

// ============================================================================
// PROPS DEL COMPONENTE DE HABILIDADES
// ============================================================================

export interface AbilitiesShopProps {
  agentName: string;
  apiAbilities?: Array<{
    slot: string;
    displayName: string;
    displayIcon?: string | null;
  }>;
  isAgentDetected?: boolean;
  chargesState: Record<string, number>; // { [abilityId]: chargesCount }
  onToggleCharge: (abilityId: string, maxCharges: number, defaultCharges: number) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL: AbilitiesShop
// ============================================================================

export default function AbilitiesShop({
  agentName,
  apiAbilities = [],
  isAgentDetected = true,
  chargesState,
  onToggleCharge,
}: AbilitiesShopProps) {
  const { t, language } = useLanguage();
  const currentLang = (language === "en" ? "en" : "es") as "es" | "en";

  // useMemo: Mapeo y localización ultra-rápida de habilidades para el agente activo
  const agentAbilities = useMemo(() => {
    return resolveAgentShopAbilities(agentName, apiAbilities, currentLang);
  }, [agentName, apiAbilities, currentLang]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.375rem",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header Bar */}
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
        <span>{t.abilitiesTitle}</span>
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
            {t.notDetectedDemo}
          </span>
        )}
      </div>

      {/* Abilities 3-Column Grid */}
      <div
        style={{
          display: "flex",
          gap: "clamp(0.6rem, 1.4vw, 1.4rem)",
          width: "100%",
          maxWidth: "50rem",
          justifyContent: "center",
        }}
      >
        {agentAbilities.map((ab) => {
          const currentCharges =
            chargesState[ab.id] !== undefined
              ? chargesState[ab.id]
              : ab.defaultCharges;

          const isFull = currentCharges >= ab.maxCharges;
          const isPurchasedAny = currentCharges > ab.defaultCharges;
          const hasAnyCharge = currentCharges > 0;

          // Texto superior de estado / costo
          let costDisplay = "";
          if (isFull) {
            costDisplay = t.abilityFull;
          } else if (ab.cost === 0) {
            costDisplay = t.abilityFree;
          } else {
            costDisplay = `¤${ab.cost}`;
          }

          // Estilo de tarjeta según estado activo
          const isHighlighted = isFull || isPurchasedAny || (ab.isSignature && hasAnyCharge);

          const cardStyle: React.CSSProperties = isHighlighted
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
              key={ab.id}
              onClick={() => onToggleCharge(ab.id, ab.maxCharges, ab.defaultCharges)}
              style={cardStyle}
              onMouseEnter={(e) => {
                if (!isHighlighted) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isHighlighted) {
                  e.currentTarget.style.background = "rgba(16, 24, 38, 0.65)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
                }
              }}
              title={`${ab.displayName} (${currentCharges}/${ab.maxCharges})`}
            >
              {/* Indicadores de carga (Puntos de Carga / Charge Dots) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  marginRight: "clamp(0.45rem, 0.9vw, 0.8rem)",
                  flexShrink: 0,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {Array.from({ length: Math.min(ab.maxCharges, 4) }).map((_, chargeIndex) => {
                  const isChargeActive = chargeIndex < currentCharges;
                  return (
                    <div
                      key={chargeIndex}
                      style={{
                        width: "0.45rem",
                        height: "0.45rem",
                        borderRadius: "50%",
                        background: isChargeActive ? "var(--color-yellow)" : "rgba(255, 255, 255, 0.22)",
                        boxShadow: isChargeActive ? "0 0 6px var(--color-yellow)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    />
                  );
                })}
              </div>

              {/* Icono de la Habilidad */}
              {ab.displayIcon && (
                <img
                  src={ab.displayIcon}
                  alt={ab.displayName}
                  style={{
                    width: "clamp(1.7rem, 3.4vh, 2.5rem)",
                    height: "clamp(1.7rem, 3.4vh, 2.5rem)",
                    objectFit: "contain",
                    filter: hasAnyCharge
                      ? "drop-shadow(0 0 6px var(--color-cyan))"
                      : "grayscale(40%) opacity(0.65)",
                    flexShrink: 0,
                    transition: "filter 0.2s ease",
                  }}
                />
              )}

              {/* Bloque de Textos: Precio / Estado y Nombre */}
              <div style={{ marginLeft: "auto", textAlign: "right", minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "clamp(0.5rem, 0.8vh, 0.62rem)",
                    color: isFull
                      ? "var(--color-cyan)"
                      : hasAnyCharge
                      ? "var(--color-yellow)"
                      : "var(--color-yellow)",
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
                    color: hasAnyCharge ? "var(--text-main)" : "var(--text-muted)",
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
  );
}
