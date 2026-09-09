"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useLanguage } from "@/context/LanguageContext";
import { CrosshairIcon, RefreshIcon } from "@/components/Icons";
import {
  CrosshairConfig,
  CrosshairPreset,
  DEFAULT_CONFIG,
  COLOR_PRESETS,
  serializeValorantCode,
  parseValorantCode,
} from "@/data";
import {
  CrosshairPreview,
  CrosshairSettingsTable,
  CrosshairImportModal,
} from "@/components/crosshair";

export type { CrosshairConfig, CrosshairPreset };

interface ViewCrosshairsProps {
  presets?: CrosshairPreset[];
  onSave?: (config: CrosshairConfig, code: string) => void;
}

export default function ViewCrosshairs({ onSave }: ViewCrosshairsProps) {
  const { setView } = useGameState();
  const { t, language } = useLanguage();

  const [config, setConfig] = useState<CrosshairConfig>(DEFAULT_CONFIG);
  const [selectedBg, setSelectedBg] = useState<string>("range");
  const [copied, setCopied] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Generate real Valorant profile code
  const currentCode = useMemo(() => serializeValorantCode(config), [config]);

  const handleCopyCode = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentCode]);

  const handleShareLink = useCallback(() => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      const url = `${window.location.origin}/?crosshair=${encodeURIComponent(currentCode)}`;
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [currentCode]);

  const handleRandomCrosshair = useCallback(() => {
    const randomHex = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)].hex;
    const randomLength = Math.floor(Math.random() * 6) + 2;
    const randomThickness = Math.floor(Math.random() * 2) + 1;
    const randomOffset = Math.floor(Math.random() * 4) + 1;
    setConfig((prev) => ({
      ...prev,
      color: randomHex,
      innerLines: true,
      innerLineLength: randomLength,
      innerLineLengthVertical: randomLength,
      innerLineThickness: randomThickness,
      innerLineOffset: randomOffset,
      outlines: Math.random() > 0.4,
      centerDot: Math.random() > 0.7,
    }));
  }, []);

  const handleApplyImport = useCallback((rawCode: string) => {
    const parsed = parseValorantCode(rawCode);
    if (parsed) {
      setConfig((prev) => ({
        ...prev,
        ...parsed,
      }));
    }
  }, []);

  return (
    <div
      className="state-view active"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        maxWidth: "1400px",
        margin: "0 auto",
        width: "100%",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      {/* Top Banner Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16, 22, 34, 0.95), rgba(11, 18, 25, 0.9))",
          border: "1px solid var(--border-cyber)",
          borderRadius: "10px",
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "8px",
              background: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-cyan)",
            }}
          >
            <CrosshairIcon size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 900,
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: "1px",
                  color: "#ffffff",
                }}
              >
                {language === "es" ? "CREADOR DE MIRAS" : "CROSSHAIR CREATOR"}
              </h2>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: "4px",
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

      {/* Main Grid: Left Preview Canvas, Right Authentic Valorant Settings Table */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(350px, 460px) 1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN: Live preview with background selector */}
        <CrosshairPreview
          config={config}
          selectedBg={selectedBg}
          onSelectBg={setSelectedBg}
          language={language}
        />

        {/* RIGHT COLUMN: Authentic Valorant In-Game Settings Panel */}
        <CrosshairSettingsTable
          config={config}
          onChangeConfig={setConfig}
          currentCode={currentCode}
          onOpenImport={() => setShowImportModal(true)}
          onCopyCode={handleCopyCode}
          copied={copied}
          onShareLink={handleShareLink}
          linkCopied={linkCopied}
          onRandom={handleRandomCrosshair}
          onReset={() => setConfig(DEFAULT_CONFIG)}
          onVideoPreview={() => setSelectedBg((prev) => (prev === "range" ? "ascent" : "range"))}
          onSave={onSave}
        />
      </div>

      {/* IMPORT CODE MODAL */}
      <CrosshairImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleApplyImport}
      />
    </div>
  );
}
