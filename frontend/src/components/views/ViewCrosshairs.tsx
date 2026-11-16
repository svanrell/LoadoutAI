"use client";

import { useGameState } from "@/hooks/useGameState";
import { useLanguage } from "@/context/LanguageContext";
import { useCrosshair } from "@/hooks/useCrosshair";
import { CrosshairIcon, RefreshIcon } from "@/components/Icons";
import {
  CrosshairConfig,
  CrosshairPreset,
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

  // Toda la lógica y estado de la mira centralizados en su propio hook
  const {
    config,
    currentCode,
    selectedBg,
    setSelectedBg,
    copied,
    showImportModal,
    setShowImportModal,
    updateSetting,
    resetCrosshair,
    randomizeCrosshair,
    applyImportCode,
    copyCode,
    saveCrosshair,
  } = useCrosshair();

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
                {t.crosshairCreatorTitle}
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
                {t.crosshairCustomReticle}
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
            onClick={resetCrosshair}
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
            {t.crosshairReset}
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
          onUpdateSetting={updateSetting}
          currentCode={currentCode}
          onOpenImport={() => setShowImportModal(true)}
          onCopyCode={copyCode}
          copied={copied}
          onRandom={randomizeCrosshair}
          onReset={resetCrosshair}
          onSave={onSave ? () => saveCrosshair(onSave) : undefined}
        />
      </div>

      {/* IMPORT CODE MODAL */}
      <CrosshairImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={applyImportCode}
      />
    </div>
  );
}
