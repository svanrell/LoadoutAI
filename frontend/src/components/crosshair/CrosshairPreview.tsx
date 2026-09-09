"use client";

import React from "react";
import { CrosshairConfig, BACKGROUNDS } from "@/data/crosshairData";

interface CrosshairPreviewProps {
  config: CrosshairConfig;
  selectedBg: string;
  onSelectBg: (id: string) => void;
  language?: string;
}

export function CrosshairPreview({
  config,
  selectedBg,
  onSelectBg,
  language = "es",
}: CrosshairPreviewProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          background: "rgba(16, 22, 34, 0.85)",
          border: "1px solid var(--border-cyber)",
          borderRadius: "10px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1px",
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}
        >
          {language === "es" ? "VISTA PREVIA EN VIVO" : "LIVE PREVIEW"}
        </span>

        {/* Target Display Area */}
        <div
          style={{
            width: "100%",
            height: "290px",
            borderRadius: "8px",
            overflow: "hidden",
            position: "relative",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: selectedBg === "chroma" ? "#00ff37" : "#0a0e14",
          }}
        >
          {selectedBg !== "chroma" && (
            <img
              src={BACKGROUNDS.find((b) => b.id === selectedBg)?.url}
              alt="Valorant preview background"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                filter:
                  selectedBg === "range"
                    ? "brightness(0.95) contrast(1.05)"
                    : "brightness(0.7) contrast(1.1)",
              }}
            />
          )}

          {/* Grid axes guidelines */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "1px",
              background: "rgba(255, 255, 255, 0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              height: "100%",
              width: "1px",
              background: "rgba(255, 255, 255, 0.08)",
            }}
          />

          {/* SVG LIVE RETICLE RENDERING */}
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
                <filter id="val-outline-filter" x="-50%" y="-50%" width="200%" height="200%">
                  <feMorphology
                    operator="dilate"
                    radius={config.outlineThickness}
                    in="SourceAlpha"
                    result="dilated"
                  />
                  <feFlood floodColor="#000000" floodOpacity={config.outlineOpacity} result="color" />
                  <feComposite in="color" in2="dilated" operator="in" result="outline" />
                  <feMerge>
                    <feMergeNode in="outline" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              )}
            </defs>

            <g filter={config.outlines ? "url(#val-outline-filter)" : undefined}>
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

              {/* Líneas Internas */}
              {config.innerLines && (
                <>
                  {/* Top */}
                  <rect
                    x={100 - config.innerLineThickness / 2}
                    y={100 - config.innerLineOffset - (config.innerLineLengthVertical ?? config.innerLineLength)}
                    width={config.innerLineThickness}
                    height={config.innerLineLengthVertical ?? config.innerLineLength}
                    fill={config.color}
                    opacity={config.innerLineOpacity}
                  />
                  {/* Bottom */}
                  <rect
                    x={100 - config.innerLineThickness / 2}
                    y={100 + config.innerLineOffset}
                    width={config.innerLineThickness}
                    height={config.innerLineLengthVertical ?? config.innerLineLength}
                    fill={config.color}
                    opacity={config.innerLineOpacity}
                  />
                  {/* Left */}
                  <rect
                    x={100 - config.innerLineOffset - config.innerLineLength}
                    y={100 - config.innerLineThickness / 2}
                    width={config.innerLineLength}
                    height={config.innerLineThickness}
                    fill={config.color}
                    opacity={config.innerLineOpacity}
                  />
                  {/* Right */}
                  <rect
                    x={100 + config.innerLineOffset}
                    y={100 - config.innerLineThickness / 2}
                    width={config.innerLineLength}
                    height={config.innerLineThickness}
                    fill={config.color}
                    opacity={config.innerLineOpacity}
                  />
                </>
              )}

              {/* Líneas Externas */}
              {config.outerLines && (
                <>
                  {/* Top */}
                  <rect
                    x={100 - config.outerLineThickness / 2}
                    y={100 - config.outerLineOffset - (config.outerLineLengthVertical ?? config.outerLineLength)}
                    width={config.outerLineThickness}
                    height={config.outerLineLengthVertical ?? config.outerLineLength}
                    fill={config.color}
                    opacity={config.outerLineOpacity}
                  />
                  {/* Bottom */}
                  <rect
                    x={100 - config.outerLineThickness / 2}
                    y={100 + config.outerLineOffset}
                    width={config.outerLineThickness}
                    height={config.outerLineLengthVertical ?? config.outerLineLength}
                    fill={config.color}
                    opacity={config.outerLineOpacity}
                  />
                  {/* Left */}
                  <rect
                    x={100 - config.outerLineOffset - config.outerLineLength}
                    y={100 - config.outerLineThickness / 2}
                    width={config.outerLineLength}
                    height={config.outerLineThickness}
                    fill={config.color}
                    opacity={config.outerLineOpacity}
                  />
                  {/* Right */}
                  <rect
                    x={100 + config.outerLineOffset}
                    y={100 - config.outerLineThickness / 2}
                    width={config.outerLineLength}
                    height={config.outerLineThickness}
                    fill={config.color}
                    opacity={config.outerLineOpacity}
                  />
                </>
              )}
            </g>
          </svg>
        </div>

        {/* Background Map Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              letterSpacing: "1px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}
          >
            TEST BACKGROUND:
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              flexWrap: "wrap",
              maxHeight: "84px",
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => onSelectBg(bg.id)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  border:
                    selectedBg === bg.id
                      ? "1px solid var(--color-cyan)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  background:
                    selectedBg === bg.id
                      ? "rgba(56, 189, 248, 0.2)"
                      : "rgba(255, 255, 255, 0.03)",
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
    </div>
  );
}
