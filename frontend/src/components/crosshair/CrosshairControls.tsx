"use client";

import { useState, type ReactNode } from "react";
import { COLOR_PRESETS } from "@/data/crosshairData";

export function SettingRow({
  label,
  children,
  isOdd = false,
}: {
  label: string;
  children: ReactNode;
  isOdd?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 18px",
        background: isOdd ? "#1d2028" : "#252934",
        minHeight: "44px",
        boxSizing: "border-box",
        gap: "14px",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#f3f4f6",
          letterSpacing: "0.2px",
          userSelect: "none",
          lineHeight: 1.35,
          flex: 1,
          paddingRight: "8px",
        }}
      >
        {label}
      </span>
      <div style={{ width: "280px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        {children}
      </div>
    </div>
  );
}

export function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: "16px 18px 8px 18px",
        fontSize: "14px",
        fontWeight: 800,
        color: "#ffffff",
        letterSpacing: "0.5px",
        background: "#161922",
      }}
    >
      {title}
    </div>
  );
}

export function SegmentedToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        borderRadius: "2px",
        overflow: "hidden",
        width: "280px",
        height: "34px",
        border: "1px solid rgba(0, 0, 0, 0.4)",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        onClick={() => onChange(true)}
        style={{
          flex: 1,
          border: "none",
          background: value ? "#707786" : "#2f3442",
          color: value ? "#ffffff" : "#8e96a4",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.5px",
          cursor: "pointer",
          transition: "background 0.12s ease",
        }}
      >
        ON
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        style={{
          flex: 1,
          border: "none",
          background: !value ? "#707786" : "#2f3442",
          color: !value ? "#ffffff" : "#8e96a4",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.5px",
          cursor: "pointer",
          transition: "background 0.12s ease",
        }}
      >
        OFF
      </button>
    </div>
  );
}

export function SettingSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}) {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "280px", boxSizing: "border-box" }}>
      <span
        style={{
          width: "36px",
          textAlign: "right",
          fontFamily: "monospace",
          fontSize: "12px",
          fontWeight: 700,
          color: "#ffffff",
          flexShrink: 0,
        }}
      >
        {value}
      </span>
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            width: "100%",
            appearance: "none",
            WebkitAppearance: "none",
            height: "3px",
            borderRadius: "2px",
            background: `linear-gradient(to right, #0084ff 0%, #0084ff ${percent}%, #d1d5db ${percent}%, #d1d5db 100%)`,
            outline: "none",
            cursor: "pointer",
            margin: 0,
          }}
        />
      </div>
    </div>
  );
}

export function LinkedLengthSlider({
  valH,
  valV,
  isLinked,
  onToggleLink,
  onChangeH,
  onChangeV,
  min = 0,
  max = 20,
}: {
  valH: number;
  valV: number;
  isLinked: boolean;
  onToggleLink: () => void;
  onChangeH: (v: number) => void;
  onChangeV: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const percentH = Math.min(100, Math.max(0, ((valH - min) / (max - min)) * 100));
  const percentV = Math.min(100, Math.max(0, ((valV - min) / (max - min)) * 100));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "280px", boxSizing: "border-box" }}>
      <span style={{ width: "16px", textAlign: "right", fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
        {valH}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={valH}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          onChangeH(v);
          if (isLinked) onChangeV(v);
        }}
        style={{
          flex: 1,
          appearance: "none",
          WebkitAppearance: "none",
          height: "3px",
          borderRadius: "2px",
          background: `linear-gradient(to right, #0084ff 0%, #0084ff ${percentH}%, #d1d5db ${percentH}%, #d1d5db 100%)`,
          outline: "none",
          cursor: "pointer",
          margin: 0,
        }}
      />
      <button
        type="button"
        onClick={onToggleLink}
        title={isLinked ? "Separar longitud vertical y horizontal" : "Vincular longitud"}
        style={{
          width: "28px",
          height: "26px",
          borderRadius: "3px",
          border: isLinked ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.12)",
          background: isLinked ? "#2f3442" : "#222630",
          color: isLinked ? "#e2e8f0" : "#64748b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          padding: 0,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
      <span style={{ width: "16px", textAlign: "right", fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
        {valV}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={valV}
        className={isLinked ? "linked-secondary-slider" : undefined}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          onChangeV(v);
          if (isLinked) onChangeH(v);
        }}
        style={{
          flex: 1,
          appearance: "none",
          WebkitAppearance: "none",
          height: "3px",
          borderRadius: "2px",
          background: isLinked
            ? `linear-gradient(to right, #94a3b8 0%, #94a3b8 ${percentV}%, #d1d5db ${percentV}%, #d1d5db 100%)`
            : `linear-gradient(to right, #0084ff 0%, #0084ff ${percentV}%, #d1d5db ${percentV}%, #d1d5db 100%)`,
          outline: "none",
          cursor: "pointer",
          margin: 0,
        }}
      />
    </div>
  );
}

export function ColorPickerRow({
  color,
  onChange,
}: {
  color: string;
  onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          width: "280px",
          height: "34px",
          borderRadius: "2px",
          overflow: "hidden",
          border: "1px solid rgba(0, 0, 0, 0.5)",
          boxSizing: "border-box",
        }}
      >
        {/* Color Swatch */}
        <div
          onClick={() => setOpen(!open)}
          style={{
            width: "55px",
            background: color,
            cursor: "pointer",
            borderRight: "1px solid rgba(0, 0, 0, 0.4)",
          }}
          title="Click to select color"
        />

        {/* Hex Text Display */}
        <div
          style={{
            flex: 1,
            background: "#181b23",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontSize: "12px",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "0.5px",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {color.toUpperCase()}
        </div>

        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            width: "110px",
            background: "#2f3442",
            border: "none",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            cursor: "pointer",
          }}
        >
          <span>Custom</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Popover Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "38px",
            zIndex: 100,
            background: "#1c202a",
            border: "1px solid #374151",
            borderRadius: "6px",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
            minWidth: "160px",
          }}
        >
          {COLOR_PRESETS.map((cp) => (
            <button
              key={cp.hex}
              type="button"
              onClick={() => {
                onChange(cp.hex);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 8px",
                borderRadius: "4px",
                border: "none",
                background: color.toLowerCase() === cp.hex.toLowerCase() ? "rgba(255, 255, 255, 0.12)" : "transparent",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ width: "14px", height: "14px", borderRadius: "3px", background: cp.hex, border: "1px solid rgba(0,0,0,0.3)" }} />
              {cp.name}
            </button>
          ))}
          <div style={{ borderTop: "1px solid #2d3340", paddingTop: "6px", display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "4px", paddingRight: "4px" }}>
            <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600 }}>Color Picker:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: "28px", height: "24px", padding: 0, border: "none", background: "none", cursor: "pointer" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
