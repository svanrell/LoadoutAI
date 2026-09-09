"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useLanguage } from "@/context/LanguageContext";
import { CrosshairIcon, RefreshIcon } from "@/components/Icons";

export interface CrosshairConfig {
  color: string;
  outlines: boolean;
  outlineOpacity: number;
  outlineThickness: number;
  centerDot: boolean;
  centerDotOpacity: number;
  centerDotSize: number;
  innerLines: boolean;
  innerLineOpacity: number;
  innerLineLength: number;
  innerLineThickness: number;
  innerLineOffset: number;
  outerLines: boolean;
  outerLineOpacity: number;
  outerLineLength: number;
  outerLineThickness: number;
  outerLineOffset: number;
}

export interface CrosshairPreset {
  id: string;
  name: string;
  team?: string;
  code?: string;
  config: CrosshairConfig;
}

interface ViewCrosshairsProps {
  /**
   * Pasa aquí los presets o miras guardadas desde tu backend.
   */
  presets?: CrosshairPreset[];
  /**
   * Callback opcional para cuando el usuario quiera guardar o sincronizar su mira con tu backend.
   */
  onSave?: (config: CrosshairConfig, code: string) => void;
}

const DEFAULT_CONFIG: CrosshairConfig = {
  color: "#00f0ff",
  outlines: true,
  outlineOpacity: 0.8,
  outlineThickness: 1,
  centerDot: false,
  centerDotOpacity: 1,
  centerDotSize: 2,
  innerLines: true,
  innerLineOpacity: 1,
  innerLineLength: 4,
  innerLineThickness: 2,
  innerLineOffset: 2,
  outerLines: false,
  outerLineOpacity: 0.35,
  outerLineLength: 2,
  outerLineThickness: 2,
  outerLineOffset: 10,
};

const BACKGROUNDS = [
  { id: "range", label: "Campo de Tiro (Bots)", url: "/backgrounds/range.webp" },
  { id: "ascent", label: "Ascent", url: "/backgrounds/ascent.webp" },
  { id: "bind", label: "Bind", url: "/backgrounds/bind.webp" },
  { id: "haven", label: "Haven", url: "/backgrounds/haven.webp" },
  { id: "split", label: "Split", url: "/backgrounds/split.webp" },
  { id: "sunset", label: "Sunset", url: "/backgrounds/sunset.webp" },
  { id: "lotus", label: "Lotus", url: "/backgrounds/lotus.webp" },
  { id: "breeze", label: "Breeze", url: "/backgrounds/breeze.webp" },
  { id: "icebox", label: "Icebox", url: "/backgrounds/icebox.webp" },
  { id: "abyss", label: "Abyss", url: "/backgrounds/abyss.webp" },
  { id: "pearl", label: "Pearl", url: "/backgrounds/pearl.webp" },
  { id: "fracture", label: "Fracture", url: "/backgrounds/fracture.webp" },
  { id: "chroma", label: "Verde Chroma", url: "chroma" },
];

export default function ViewCrosshairs({ presets = [], onSave }: ViewCrosshairsProps) {
  const { setView } = useGameState();
  const { t, language } = useLanguage();

  const [config, setConfig] = useState<CrosshairConfig>(DEFAULT_CONFIG);
  const [selectedBg, setSelectedBg] = useState<string>("range");
  const [customCode, setCustomCode] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

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
              background: "rgba(56, 189, 248, 0.1)",
              border: "1.5px solid var(--color-cyan)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-cyan)",
              boxShadow: "0 0 15px rgba(56, 189, 248, 0.25)",
            }}
          >
            <CrosshairIcon size={24} />
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
                {t.crosshairs.toUpperCase()}
              </h1>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  color: "var(--color-cyan)",
                  letterSpacing: "0.5px",
                }}
              >
                CUSTOM RETICLE
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", marginBottom: 0 }}>
              {t.crosshairsDesc}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="cyber-btn-secondary"
            onClick={() => setConfig(DEFAULT_CONFIG)}
            style={{
              padding: "7px 14px",
              fontSize: "11px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshIcon size={12} />
            {language === "es" ? "RESTABLECER" : "RESET"}
          </button>
          <button
            className="cyber-btn-secondary"
            onClick={() => setView("menu")}
            style={{ padding: "7px 14px", fontSize: "11px", fontWeight: 700 }}
          >
            {t.backToProfile}
          </button>
        </div>
      </div>

      {/* Main Grid Visual */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(340px, 480px) 1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN: Visualizer Canvas & Code Box */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              background: "rgba(16, 22, 34, 0.8)",
              border: "1px solid var(--border-cyber)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                {language === "es" ? "VISTA PREVIA EN VIVO" : "LIVE PREVIEW"}
              </span>
            </div>

            {/* Target Display Area */}
            <div
              style={{
                width: "100%",
                height: "280px",
                borderRadius: "8px",
                overflow: "hidden",
                position: "relative",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  selectedBg === "chroma"
                    ? "#00ff37"
                    : "#0a0e14",
              }}
            >
              {selectedBg !== "chroma" && (
                <img
                  src={BACKGROUNDS.find((b) => b.id === selectedBg)?.url}
                  alt="Valorant map background"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: selectedBg === "range" ? "center 50%" : "center",
                    filter: selectedBg === "range" ? "brightness(0.95) contrast(1.05)" : "brightness(0.7) contrast(1.1)",
                  }}
                />
              )}

              <div style={{ position: "absolute", width: "100%", height: "1px", background: "rgba(255, 255, 255, 0.06)" }} />
              <div style={{ position: "absolute", height: "100%", width: "1px", background: "rgba(255, 255, 255, 0.06)" }} />

              {/* RENDERIZADO VISUAL SVG DE LA MIRA */}
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                style={{
                  position: "relative",
                  zIndex: 2,
                  overflow: "visible",
                }}
              >
                <defs>
                  {config.outlines && (
                    <filter id="outline-filter" x="-50%" y="-50%" width="200%" height="200%">
                      <feMorphology operator="dilate" radius={config.outlineThickness} in="SourceAlpha" result="dilated" />
                      <feFlood floodColor="#000000" floodOpacity={config.outlineOpacity} result="color" />
                      <feComposite in="color" in2="dilated" operator="in" result="outline" />
                      <feMerge>
                        <feMergeNode in="outline" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  )}
                </defs>

                <g filter={config.outlines ? "url(#outline-filter)" : undefined}>
                  {/* Punto Central */}
                  {config.centerDot && (
                    <rect
                      x={100 - config.centerDotSize / 2}
                      y={100 - config.centerDotSize / 2}
                      width={config.centerDotSize}
                      height={config.centerDotSize}
                      fill={config.color}
                      opacity={config.centerDotOpacity}
                    />
                  )}

                  {/* Líneas Interiores */}
                  {config.innerLines && (
                    <g opacity={config.innerLineOpacity}>
                      <rect
                        x={100 - config.innerLineThickness / 2}
                        y={100 - config.innerLineOffset - config.innerLineLength}
                        width={config.innerLineThickness}
                        height={config.innerLineLength}
                        fill={config.color}
                      />
                      <rect
                        x={100 - config.innerLineThickness / 2}
                        y={100 + config.innerLineOffset}
                        width={config.innerLineThickness}
                        height={config.innerLineLength}
                        fill={config.color}
                      />
                      <rect
                        x={100 - config.innerLineOffset - config.innerLineLength}
                        y={100 - config.innerLineThickness / 2}
                        width={config.innerLineLength}
                        height={config.innerLineThickness}
                        fill={config.color}
                      />
                      <rect
                        x={100 + config.innerLineOffset}
                        y={100 - config.innerLineThickness / 2}
                        width={config.innerLineLength}
                        height={config.innerLineThickness}
                        fill={config.color}
                      />
                    </g>
                  )}

                  {/* Líneas Exteriores */}
                  {config.outerLines && (
                    <g opacity={config.outerLineOpacity}>
                      <rect
                        x={100 - config.outerLineThickness / 2}
                        y={100 - config.outerLineOffset - config.outerLineLength}
                        width={config.outerLineThickness}
                        height={config.outerLineLength}
                        fill={config.color}
                      />
                      <rect
                        x={100 - config.outerLineThickness / 2}
                        y={100 + config.outerLineOffset}
                        width={config.outerLineThickness}
                        height={config.outerLineLength}
                        fill={config.color}
                      />
                      <rect
                        x={100 - config.outerLineOffset - config.outerLineLength}
                        y={100 - config.outerLineThickness / 2}
                        width={config.outerLineLength}
                        height={config.outerLineThickness}
                        fill={config.color}
                      />
                      <rect
                        x={100 + config.outerLineOffset}
                        y={100 - config.outerLineThickness / 2}
                        width={config.outerLineLength}
                        height={config.outerLineThickness}
                        fill={config.color}
                      />
                    </g>
                  )}
                </g>
              </svg>
            </div>

            {/* Selector de fondos */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                {language === "es" ? "FONDO DE PRUEBA:" : "TEST BACKGROUND:"}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  flexWrap: "wrap",
                  maxHeight: "82px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setSelectedBg(bg.id)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "10.5px",
                      fontWeight: 600,
                      border: selectedBg === bg.id ? "1px solid var(--color-cyan)" : "1px solid rgba(255, 255, 255, 0.08)",
                      background: selectedBg === bg.id ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.03)",
                      color: selectedBg === bg.id ? "var(--color-cyan)" : "var(--text-muted)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Caja de Código para que conectes tu backend */}
          <div
            style={{
              background: "rgba(16, 22, 34, 0.8)",
              border: "1px solid var(--border-cyber)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", textTransform: "uppercase" }}>
              {language === "es" ? "CÓDIGO DE PERFIL / IMPORTACIÓN" : "PROFILE CODE / IMPORT"}
            </span>

            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder={language === "es" ? "Pega aquí el código de mira..." : "Paste crosshair code here..."}
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "11px",
                color: "#fff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => {
                  if (customCode) {
                    navigator.clipboard.writeText(customCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  border: "none",
                  background: copied ? "var(--color-green)" : "var(--color-cyan)",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {copied ? "✓ ¡COPIADO!" : "COPIAR CÓDIGO"}
              </button>
              {onSave && (
                <button
                  onClick={() => onSave(config, customCode)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: "var(--color-green)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  GUARDAR
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sliders de Ajuste Visual */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              background: "rgba(16, 22, 34, 0.8)",
              border: "1px solid var(--border-cyber)",
              borderRadius: "10px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Color */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)" }}>
                  {language === "es" ? "Color de la Mira" : "Crosshair Color"}
                </span>
                <span style={{ fontSize: "11px", fontFamily: "monospace", color: config.color, fontWeight: 700 }}>
                  {config.color.toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                {[
                  { name: "Cyan", hex: "#00f0ff" },
                  { name: "Verde", hex: "#00ff00" },
                  { name: "Amarillo", hex: "#ffff00" },
                  { name: "Blanco", hex: "#ffffff" },
                  { name: "Rojo", hex: "#ff4655" },
                  { name: "Rosa", hex: "#ff1493" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setConfig({ ...config, color: c.hex })}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: c.hex,
                      border: config.color.toLowerCase() === c.hex.toLowerCase() ? "2px solid #fff" : "1px solid rgba(0,0,0,0.4)",
                      cursor: "pointer",
                    }}
                    title={c.name}
                  />
                ))}
                <input
                  type="color"
                  value={config.color}
                  onChange={(e) => setConfig({ ...config, color: e.target.value })}
                  style={{ width: "32px", height: "30px", border: "none", background: "transparent", cursor: "pointer" }}
                />
              </div>
            </div>

            {/* Contornos y Punto Central */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                padding: "14px",
                borderRadius: "8px",
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              {/* Contornos */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-main)" }}>
                    {language === "es" ? "Contornos" : "Outlines"}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.outlines}
                    onChange={(e) => setConfig({ ...config, outlines: e.target.checked })}
                    style={{ cursor: "pointer", accentColor: "var(--color-cyan)" }}
                  />
                </div>
                {config.outlines && (
                  <>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                        <span>{language === "es" ? "Opacidad" : "Opacity"}</span>
                        <span>{config.outlineOpacity.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.outlineOpacity}
                        onChange={(e) => setConfig({ ...config, outlineOpacity: parseFloat(e.target.value) })}
                        style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                      />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                        <span>{language === "es" ? "Grosor" : "Thickness"}</span>
                        <span>{config.outlineThickness}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={config.outlineThickness}
                        onChange={(e) => setConfig({ ...config, outlineThickness: parseInt(e.target.value, 10) })}
                        style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Punto Central */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-main)" }}>
                    {language === "es" ? "Punto Central" : "Center Dot"}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.centerDot}
                    onChange={(e) => setConfig({ ...config, centerDot: e.target.checked })}
                    style={{ cursor: "pointer", accentColor: "var(--color-cyan)" }}
                  />
                </div>
                {config.centerDot && (
                  <>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                        <span>{language === "es" ? "Opacidad" : "Opacity"}</span>
                        <span>{config.centerDotOpacity.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.centerDotOpacity}
                        onChange={(e) => setConfig({ ...config, centerDotOpacity: parseFloat(e.target.value) })}
                        style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                      />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                        <span>{language === "es" ? "Tamaño" : "Size"}</span>
                        <span>{config.centerDotSize}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        value={config.centerDotSize}
                        onChange={(e) => setConfig({ ...config, centerDotSize: parseInt(e.target.value, 10) })}
                        style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Líneas Interiores */}
            <div
              style={{
                padding: "14px",
                borderRadius: "8px",
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)" }}>
                  {language === "es" ? "Líneas Interiores" : "Inner Lines"}
                </span>
                <input
                  type="checkbox"
                  checked={config.innerLines}
                  onChange={(e) => setConfig({ ...config, innerLines: e.target.checked })}
                  style={{ cursor: "pointer", accentColor: "var(--color-cyan)" }}
                />
              </div>
              {config.innerLines && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span>Longitud</span>
                      <span>{config.innerLineLength}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="16"
                      value={config.innerLineLength}
                      onChange={(e) => setConfig({ ...config, innerLineLength: parseInt(e.target.value, 10) })}
                      style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span>Grosor</span>
                      <span>{config.innerLineThickness}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={config.innerLineThickness}
                      onChange={(e) => setConfig({ ...config, innerLineThickness: parseInt(e.target.value, 10) })}
                      style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span>Offset</span>
                      <span>{config.innerLineOffset}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      value={config.innerLineOffset}
                      onChange={(e) => setConfig({ ...config, innerLineOffset: parseInt(e.target.value, 10) })}
                      style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span>Opacidad</span>
                      <span>{config.innerLineOpacity.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.innerLineOpacity}
                      onChange={(e) => setConfig({ ...config, innerLineOpacity: parseFloat(e.target.value) })}
                      style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Líneas Exteriores */}
            <div
              style={{
                padding: "14px",
                borderRadius: "8px",
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)" }}>
                  {language === "es" ? "Líneas Exteriores" : "Outer Lines"}
                </span>
                <input
                  type="checkbox"
                  checked={config.outerLines}
                  onChange={(e) => setConfig({ ...config, outerLines: e.target.checked })}
                  style={{ cursor: "pointer", accentColor: "var(--color-cyan)" }}
                />
              </div>
              {config.outerLines && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span>Longitud</span>
                      <span>{config.outerLineLength}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="16"
                      value={config.outerLineLength}
                      onChange={(e) => setConfig({ ...config, outerLineLength: parseInt(e.target.value, 10) })}
                      style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span>Grosor</span>
                      <span>{config.outerLineThickness}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={config.outerLineThickness}
                      onChange={(e) => setConfig({ ...config, outerLineThickness: parseInt(e.target.value, 10) })}
                      style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span>Offset</span>
                      <span>{config.outerLineOffset}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={config.outerLineOffset}
                      onChange={(e) => setConfig({ ...config, outerLineOffset: parseInt(e.target.value, 10) })}
                      style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span>Opacidad</span>
                      <span>{config.outerLineOpacity.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.outerLineOpacity}
                      onChange={(e) => setConfig({ ...config, outerLineOpacity: parseFloat(e.target.value) })}
                      style={{ width: "100%", accentColor: "var(--color-cyan)" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Presets Grid (listo para los datos que traigas de tu backend) */}
          {presets.length > 0 && (
            <div
              style={{
                background: "rgba(16, 22, 34, 0.8)",
                border: "1px solid var(--border-cyber)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                {language === "es" ? "PRESETS GUARDADOS" : "SAVED PRESETS"}
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => setConfig({ ...preset.config })}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{preset.name}</span>
                    {preset.team && <span style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>{preset.team}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
