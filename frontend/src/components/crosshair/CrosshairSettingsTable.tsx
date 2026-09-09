"use client";

import React, { useState } from "react";
import { CrosshairConfig } from "@/data/crosshairData";
import {
  SettingRow,
  SectionHeader,
  SegmentedToggle,
  SettingSlider,
  LinkedLengthSlider,
  ColorPickerRow,
} from "./CrosshairControls";

interface CrosshairSettingsTableProps {
  config: CrosshairConfig;
  onChangeConfig: (newConfig: CrosshairConfig) => void;
  currentCode: string;
  onOpenImport: () => void;
  onCopyCode: () => void;
  copied: boolean;
  onShareLink: () => void;
  linkCopied: boolean;
  onRandom: () => void;
  onReset: () => void;
  onVideoPreview?: () => void;
  onSave?: (config: CrosshairConfig, code: string) => void;
}

export function CrosshairSettingsTable({
  config,
  onChangeConfig,
  currentCode,
  onOpenImport,
  onCopyCode,
  copied,
  onShareLink,
  linkCopied,
  onRandom,
  onReset,
  onVideoPreview,
  onSave,
}: CrosshairSettingsTableProps) {
  const [activeSubTab, setActiveSubTab] = useState<"General" | "Primary" | "Aim Down Sights" | "Sniper">("Primary");

  return (
    <div
      style={{
        background: "#161922",
        border: "1px solid #2d3340",
        borderRadius: "6px",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Bar: Import Button & Centered Profile Code Display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 16px",
          background: "#222630",
          borderBottom: "1px solid #2d3340",
        }}
      >
        <button
          type="button"
          onClick={onOpenImport}
          style={{
            padding: "6px 16px",
            borderRadius: "3px",
            background: "#2a2e39",
            border: "1px solid #4b5563",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          Import
        </button>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            background: "#181b23",
            border: "1px solid #374151",
            borderRadius: "3px",
            padding: "4px 8px",
          }}
        >
          <input
            type="text"
            readOnly
            value={currentCode}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontFamily: "monospace",
              fontSize: "11.5px",
              fontWeight: 700,
              textAlign: "center",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={onCopyCode}
            title={copied ? "Copiado!" : "Copiar código"}
            style={{
              background: "transparent",
              border: "none",
              color: copied ? "#22c55e" : "#8e96a4",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "3px",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px",
          background: "#1b1f28",
          borderBottom: "1px solid #282d38",
        }}
      >
        {(["General", "Primary", "Aim Down Sights", "Sniper"] as const).map((tab) => {
          const isActive = activeSubTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveSubTab(tab)}
              style={{
                padding: "6px clamp(12px, 2vw, 36px)",
                borderRadius: "4px",
                border: "none",
                background: isActive ? "#ff4655" : "transparent",
                color: isActive ? "#ffffff" : "#8a92a0",
                fontSize: "11.5px",
                fontWeight: 700,
                letterSpacing: "0.5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Settings List Container with authentic red scrollbar & indicator arrows */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Red scroll indicator arrows */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "2px",
            zIndex: 10,
            pointerEvents: "none",
            color: "#ff4655",
            fontSize: "9px",
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          ▲
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "4px",
            right: "2px",
            zIndex: 10,
            pointerEvents: "none",
            color: "#ff4655",
            fontSize: "9px",
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          ▼
        </div>

        <div
          className="valorant-settings-scroll"
          style={{
            maxHeight: "560px",
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* PRIMARY TAB */}
          {activeSubTab === "Primary" && (
            <>
              {/* CROSSHAIR SECTION */}
              <SectionHeader title="Crosshair" />

              {/* Crosshair Color */}
              <SettingRow label="Crosshair Color" isOdd={false}>
                <ColorPickerRow
                  color={config.color}
                  onChange={(c) => onChangeConfig({ ...config, color: c })}
                />
              </SettingRow>

              {/* Outlines */}
              <SettingRow label="Outlines" isOdd={true}>
                <SegmentedToggle
                  value={config.outlines}
                  onChange={(v) => onChangeConfig({ ...config, outlines: v })}
                />
              </SettingRow>

              {/* Outline Opacity */}
              <SettingRow label="Outline Opacity" isOdd={false}>
                <SettingSlider
                  value={config.outlineOpacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => onChangeConfig({ ...config, outlineOpacity: v })}
                />
              </SettingRow>

              {/* Outline Thickness */}
              <SettingRow label="Outline Thickness" isOdd={true}>
                <SettingSlider
                  value={config.outlineThickness}
                  min={1}
                  max={6}
                  step={1}
                  onChange={(v) => onChangeConfig({ ...config, outlineThickness: v })}
                />
              </SettingRow>

              {/* Center Dot */}
              <SettingRow label="Center Dot" isOdd={false}>
                <SegmentedToggle
                  value={config.centerDot}
                  onChange={(v) => onChangeConfig({ ...config, centerDot: v })}
                />
              </SettingRow>

              {/* Center Dot Opacity */}
              <SettingRow label="Center Dot Opacity" isOdd={true}>
                <SettingSlider
                  value={config.centerDotOpacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => onChangeConfig({ ...config, centerDotOpacity: v })}
                />
              </SettingRow>

              {/* Center Dot Thickness */}
              <SettingRow label="Center Dot Thickness" isOdd={false}>
                <SettingSlider
                  value={config.centerDotSize}
                  min={1}
                  max={6}
                  step={1}
                  onChange={(v) => onChangeConfig({ ...config, centerDotSize: v })}
                />
              </SettingRow>

              {/* Override Firing Error */}
              <SettingRow label="Override Firing Error Offset With Crosshair Offset" isOdd={true}>
                <SegmentedToggle
                  value={config.overrideFiringError}
                  onChange={(v) => onChangeConfig({ ...config, overrideFiringError: v })}
                />
              </SettingRow>

              {/* Override All Primary */}
              <SettingRow label="Override All Primary Crosshairs With My Primary Crosshair" isOdd={false}>
                <SegmentedToggle
                  value={config.overrideAllPrimary}
                  onChange={(v) => onChangeConfig({ ...config, overrideAllPrimary: v })}
                />
              </SettingRow>

              {/* INNER LINES SECTION */}
              <SectionHeader title="Inner Lines" />

              {/* Show Inner Lines */}
              <SettingRow label="Show Inner Lines" isOdd={false}>
                <SegmentedToggle
                  value={config.innerLines}
                  onChange={(v) => onChangeConfig({ ...config, innerLines: v })}
                />
              </SettingRow>

              {/* Inner Line Opacity */}
              <SettingRow label="Inner Line Opacity" isOdd={true}>
                <SettingSlider
                  value={config.innerLineOpacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => onChangeConfig({ ...config, innerLineOpacity: v })}
                />
              </SettingRow>

              {/* Inner Line Length */}
              <SettingRow label="Inner Line Length" isOdd={false}>
                <LinkedLengthSlider
                  valH={config.innerLineLength}
                  valV={config.innerLineLengthVertical ?? config.innerLineLength}
                  isLinked={config.innerLineLinked}
                  onToggleLink={() =>
                    onChangeConfig({ ...config, innerLineLinked: !config.innerLineLinked })
                  }
                  onChangeH={(v) => onChangeConfig({ ...config, innerLineLength: v })}
                  onChangeV={(v) => onChangeConfig({ ...config, innerLineLengthVertical: v })}
                />
              </SettingRow>

              {/* Inner Line Thickness */}
              <SettingRow label="Inner Line Thickness" isOdd={true}>
                <SettingSlider
                  value={config.innerLineThickness}
                  min={1}
                  max={10}
                  step={1}
                  onChange={(v) => onChangeConfig({ ...config, innerLineThickness: v })}
                />
              </SettingRow>

              {/* Inner Line Offset */}
              <SettingRow label="Inner Line Offset" isOdd={false}>
                <SettingSlider
                  value={config.innerLineOffset}
                  min={0}
                  max={20}
                  step={1}
                  onChange={(v) => onChangeConfig({ ...config, innerLineOffset: v })}
                />
              </SettingRow>

              {/* Movement Error */}
              <SettingRow label="Movement Error" isOdd={true}>
                <SegmentedToggle
                  value={config.innerMovementError}
                  onChange={(v) => onChangeConfig({ ...config, innerMovementError: v })}
                />
              </SettingRow>

              {/* Movement Error Multiplier */}
              <SettingRow label="Movement Error Multiplier" isOdd={false}>
                <SettingSlider
                  value={config.innerMovementErrorMult}
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={(v) => onChangeConfig({ ...config, innerMovementErrorMult: v })}
                />
              </SettingRow>

              {/* Firing Error */}
              <SettingRow label="Firing Error" isOdd={true}>
                <SegmentedToggle
                  value={config.innerFiringError}
                  onChange={(v) => onChangeConfig({ ...config, innerFiringError: v })}
                />
              </SettingRow>

              {/* Firing Error Multiplier */}
              <SettingRow label="Firing Error Multiplier" isOdd={false}>
                <SettingSlider
                  value={config.innerFiringErrorMult}
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={(v) => onChangeConfig({ ...config, innerFiringErrorMult: v })}
                />
              </SettingRow>

              {/* OUTER LINES SECTION */}
              <SectionHeader title="Outer Lines" />

              {/* Show Outer Lines */}
              <SettingRow label="Show Outer Lines" isOdd={false}>
                <SegmentedToggle
                  value={config.outerLines}
                  onChange={(v) => onChangeConfig({ ...config, outerLines: v })}
                />
              </SettingRow>

              {/* Outer Line Opacity */}
              <SettingRow label="Outer Line Opacity" isOdd={true}>
                <SettingSlider
                  value={config.outerLineOpacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => onChangeConfig({ ...config, outerLineOpacity: v })}
                />
              </SettingRow>

              {/* Outer Line Length */}
              <SettingRow label="Outer Line Length" isOdd={false}>
                <LinkedLengthSlider
                  valH={config.outerLineLength}
                  valV={config.outerLineLengthVertical ?? config.outerLineLength}
                  isLinked={config.outerLineLinked}
                  onToggleLink={() =>
                    onChangeConfig({ ...config, outerLineLinked: !config.outerLineLinked })
                  }
                  onChangeH={(v) => onChangeConfig({ ...config, outerLineLength: v })}
                  onChangeV={(v) => onChangeConfig({ ...config, outerLineLengthVertical: v })}
                />
              </SettingRow>

              {/* Outer Line Thickness */}
              <SettingRow label="Outer Line Thickness" isOdd={true}>
                <SettingSlider
                  value={config.outerLineThickness}
                  min={1}
                  max={10}
                  step={1}
                  onChange={(v) => onChangeConfig({ ...config, outerLineThickness: v })}
                />
              </SettingRow>

              {/* Outer Line Offset */}
              <SettingRow label="Outer Line Offset" isOdd={false}>
                <SettingSlider
                  value={config.outerLineOffset}
                  min={0}
                  max={40}
                  step={1}
                  onChange={(v) => onChangeConfig({ ...config, outerLineOffset: v })}
                />
              </SettingRow>

              {/* Movement Error */}
              <SettingRow label="Movement Error" isOdd={true}>
                <SegmentedToggle
                  value={config.outerMovementError}
                  onChange={(v) => onChangeConfig({ ...config, outerMovementError: v })}
                />
              </SettingRow>

              {/* Movement Error Multiplier */}
              <SettingRow label="Movement Error Multiplier" isOdd={false}>
                <SettingSlider
                  value={config.outerMovementErrorMult}
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={(v) => onChangeConfig({ ...config, outerMovementErrorMult: v })}
                />
              </SettingRow>

              {/* Firing Error */}
              <SettingRow label="Firing Error" isOdd={true}>
                <SegmentedToggle
                  value={config.outerFiringError}
                  onChange={(v) => onChangeConfig({ ...config, outerFiringError: v })}
                />
              </SettingRow>

              {/* Firing Error Multiplier */}
              <SettingRow label="Firing Error Multiplier" isOdd={false}>
                <SettingSlider
                  value={config.outerFiringErrorMult}
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={(v) => onChangeConfig({ ...config, outerFiringErrorMult: v })}
                />
              </SettingRow>
            </>
          )}

          {/* GENERAL TAB */}
          {activeSubTab === "General" && (
            <>
              <SectionHeader title="Crosshair Profile" />
              <SettingRow label="Use Advanced Options" isOdd={false}>
                <SegmentedToggle value={true} onChange={() => {}} />
              </SettingRow>
              <SettingRow label="Hide Crosshair" isOdd={true}>
                <SegmentedToggle value={false} onChange={() => {}} />
              </SettingRow>
              <SettingRow label="Fade Crosshair With Firing Error" isOdd={false}>
                <SegmentedToggle value={false} onChange={() => {}} />
              </SettingRow>
              <SettingRow label="Show Spectated Player's Crosshair" isOdd={true}>
                <SegmentedToggle value={true} onChange={() => {}} />
              </SettingRow>
            </>
          )}

          {/* AIM DOWN SIGHTS TAB */}
          {activeSubTab === "Aim Down Sights" && (
            <>
              <SectionHeader title="Aim Down Sights (ADS)" />
              <SettingRow label="Copy Primary Crosshair" isOdd={false}>
                <SegmentedToggle value={true} onChange={() => {}} />
              </SettingRow>
              <SettingRow label="Override Firing Error Offset With ADS Crosshair Offset" isOdd={true}>
                <SegmentedToggle value={false} onChange={() => {}} />
              </SettingRow>
            </>
          )}

          {/* SNIPER TAB */}
          {activeSubTab === "Sniper" && (
            <>
              <SectionHeader title="Sniper Scope" />
              <SettingRow label="Display Center Dot" isOdd={false}>
                <SegmentedToggle
                  value={config.centerDot}
                  onChange={(v) => onChangeConfig({ ...config, centerDot: v })}
                />
              </SettingRow>
              <SettingRow label="Center Dot Color" isOdd={true}>
                <ColorPickerRow
                  color={config.color}
                  onChange={(c) => onChangeConfig({ ...config, color: c })}
                />
              </SettingRow>
              <SettingRow label="Center Dot Opacity" isOdd={false}>
                <SettingSlider
                  value={config.centerDotOpacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => onChangeConfig({ ...config, centerDotOpacity: v })}
                />
              </SettingRow>
              <SettingRow label="Center Dot Thickness" isOdd={true}>
                <SettingSlider
                  value={config.centerDotSize}
                  min={1}
                  max={6}
                  step={1}
                  onChange={(v) => onChangeConfig({ ...config, centerDotSize: v })}
                />
              </SettingRow>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM ACTIONS BAR MATCHING USER'S SCREENSHOT */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "12px 14px",
          background: "#161922",
          borderTop: "1px solid #282d38",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={onVideoPreview}
          style={{
            padding: "7px 15px",
            borderRadius: "3px",
            background: "#161224",
            border: "1.5px solid #a855f7",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.3px",
          }}
        >
          Video Preview
        </button>

        <button
          type="button"
          onClick={onRandom}
          style={{
            padding: "7px 15px",
            borderRadius: "3px",
            background: "#241026",
            border: "1.5px solid #d946ef",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.3px",
          }}
        >
          Random
        </button>

        <button
          type="button"
          onClick={onShareLink}
          style={{
            padding: "7px 16px",
            borderRadius: "3px",
            background: "#2563eb",
            border: "none",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.3px",
          }}
        >
          {linkCopied ? "Link Copied!" : "Share Link"}
        </button>

        <button
          type="button"
          onClick={onCopyCode}
          style={{
            padding: "7px 16px",
            borderRadius: "3px",
            background: copied ? "#15803d" : "#16a34a",
            border: "none",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.3px",
          }}
        >
          {copied ? "Copied!" : "Copy Code"}
        </button>

        <button
          type="button"
          onClick={onReset}
          style={{
            padding: "7px 16px",
            borderRadius: "3px",
            background: "#dc2626",
            border: "none",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.3px",
          }}
        >
          Reset
        </button>

        {onSave && (
          <button
            type="button"
            onClick={() => onSave(config, currentCode)}
            style={{
              padding: "7px 16px",
              borderRadius: "3px",
              background: "var(--color-cyan)",
              border: "none",
              color: "#000",
              fontSize: "11px",
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: "0.3px",
            }}
          >
            Save
          </button>
        )}
      </div>

      {/* Global CSS for the custom Valorant red scrollbar & range inputs */}
      <style jsx global>{`
        .valorant-settings-scroll {
          scrollbar-width: thin;
          scrollbar-color: #ff4655 #141720;
        }
        .valorant-settings-scroll::-webkit-scrollbar {
          width: 7px;
        }
        .valorant-settings-scroll::-webkit-scrollbar-track {
          background: #141720;
        }
        .valorant-settings-scroll::-webkit-scrollbar-thumb {
          background: #ff4655;
          border-radius: 4px;
        }
        .valorant-settings-scroll::-webkit-scrollbar-thumb:hover {
          background: #ff2a3c;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #0084ff;
          cursor: pointer;
          box-shadow: 0 0 5px rgba(0, 132, 255, 0.7);
        }
        input[type="range"]::-moz-range-thumb {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #0084ff;
          border: none;
          cursor: pointer;
        }
        .linked-secondary-slider::-webkit-slider-thumb {
          background: #cbd5e1 !important;
          box-shadow: none !important;
        }
        .linked-secondary-slider::-moz-range-thumb {
          background: #cbd5e1 !important;
        }
      `}</style>
    </div>
  );
}
