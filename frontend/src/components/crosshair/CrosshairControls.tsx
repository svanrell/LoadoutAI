"use client";

import { useState, type ReactNode } from "react";
import { COLOR_PRESETS } from "@/data/crosshairData";

export function InfoTooltip({ text }: { text: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "15px",
        height: "15px",
        borderRadius: "50%",
        border: hovered ? "1.5px solid #ffffff" : "1.5px solid rgba(148, 163, 184, 0.55)",
        color: hovered ? "#ffffff" : "#94a3b8",
        fontSize: "10px",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 700,
        cursor: "help",
        marginLeft: "7px",
        verticalAlign: "middle",
        transition: "all 0.15s ease",
        flexShrink: 0,
      }}
    >
      i
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#0d151c",
            color: "#ece8e1",
            border: "1px solid #2d4153",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.8)",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "11px",
            lineHeight: 1.4,
            fontWeight: 500,
            whiteSpace: "normal",
            width: "max-content",
            maxWidth: "260px",
            zIndex: 9999,
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          {text}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #2d4153",
            }}
          />
        </div>
      )}
    </span>
  );
}

export function SettingRow({
  label,
  children,
  isOdd = false,
  tooltip,
  level = 0,
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  isOdd?: boolean;
  tooltip?: string;
  level?: number;
  disabled?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const paddingLeft = level === 2 ? "52px" : level === 1 ? "36px" : "22px";

  return (
    <div
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `8px 22px 8px ${paddingLeft}`,
        background: disabled
          ? isOdd
            ? "rgba(18, 26, 34, 0.2)"
            : "rgba(14, 20, 26, 0.15)"
          : isHovered
          ? "rgba(35, 52, 68, 0.35)"
          : isOdd
          ? "rgba(22, 32, 42, 0.35)"
          : "rgba(16, 24, 32, 0.25)",
        minHeight: "50px",
        boxSizing: "border-box",
        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
        gap: "14px",
        transition: "background 0.12s ease, opacity 0.2s ease",
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? "none" : "auto",
        filter: disabled ? "grayscale(0.6)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          paddingRight: "8px",
        }}
      >
        {level > 0 && (
          <span
            style={{
              color: disabled ? "#4b5563" : "#7a91a4",
              fontWeight: 700,
              fontSize: "14px",
              marginRight: "8px",
              userSelect: "none",
              fontFamily: "monospace",
            }}
          >
            ─
          </span>
        )}
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: disabled ? "#64748b" : "#e2e8f0",
            letterSpacing: "0.2px",
            userSelect: "none",
            lineHeight: 1.35,
          }}
        >
          {label}
        </span>
        {tooltip && !disabled && <InfoTooltip text={tooltip} />}
      </div>
      <div style={{ width: "270px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        {children}
      </div>
    </div>
  );
}

export function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: "18px 22px 8px 22px",
        fontSize: "12px",
        fontWeight: 800,
        color: "#ece8e1",
        letterSpacing: "1.2px",
        textTransform: "uppercase",
        background: "transparent",
        userSelect: "none",
      }}
    >
      {title}
    </div>
  );
}

export function SegmentedToggle({
  value,
  onChange,
  activeLabel = "ACTIVADO",
  inactiveLabel = "DESACTIVADO",
  disabled = false,
}: {
  value: boolean;
  onChange: (val: boolean) => void;
  activeLabel?: string;
  inactiveLabel?: string;
  disabled?: boolean;
}) {
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        gap: "3px",
        width: "270px",
        height: "36px",
        boxSizing: "border-box",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {/* Left button: ACTIVE (true) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(true)}
        onMouseEnter={() => !disabled && setHoverLeft(true)}
        onMouseLeave={() => setHoverLeft(false)}
        style={{
          flex: 1,
          borderRadius: "2px",
          border: disabled
            ? "1px solid rgba(60, 85, 105, 0.15)"
            : value
            ? "1px solid rgba(135, 175, 205, 0.45)"
            : hoverLeft
            ? "1px solid rgba(80, 110, 135, 0.4)"
            : "1px solid rgba(60, 85, 105, 0.25)",
          background: disabled
            ? value
              ? "rgba(62, 90, 114, 0.25)"
              : "rgba(16, 26, 36, 0.25)"
            : value
            ? "rgba(62, 90, 114, 0.45)"
            : hoverLeft
            ? "rgba(28, 44, 58, 0.65)"
            : "rgba(16, 26, 36, 0.5)",
          color: disabled
            ? value
              ? "#8ea6be"
              : "#4f6375"
            : value
            ? "#ffffff"
            : hoverLeft
            ? "#b8c8d6"
            : "#7a91a4",
          fontSize: "11.5px",
          fontWeight: 700,
          letterSpacing: "0.8px",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: value && !disabled ? "inset 0 0 10px rgba(80, 130, 170, 0.15)" : "none",
          textTransform: "uppercase",
        }}
      >
        {activeLabel}
      </button>

      {/* Right button: INACTIVE (false) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(false)}
        onMouseEnter={() => !disabled && setHoverRight(true)}
        onMouseLeave={() => setHoverRight(false)}
        style={{
          flex: 1,
          borderRadius: "2px",
          border: disabled
            ? "1px solid rgba(60, 85, 105, 0.15)"
            : !value
            ? "1px solid rgba(135, 175, 205, 0.45)"
            : hoverRight
            ? "1px solid rgba(80, 110, 135, 0.4)"
            : "1px solid rgba(60, 85, 105, 0.25)",
          background: disabled
            ? !value
              ? "rgba(62, 90, 114, 0.25)"
              : "rgba(16, 26, 36, 0.25)"
            : !value
            ? "rgba(62, 90, 114, 0.45)"
            : hoverRight
            ? "rgba(28, 44, 58, 0.65)"
            : "rgba(16, 26, 36, 0.5)",
          color: disabled
            ? !value
              ? "#8ea6be"
              : "#4f6375"
            : !value
            ? "#ffffff"
            : hoverRight
            ? "#b8c8d6"
            : "#7a91a4",
          fontSize: "11.5px",
          fontWeight: 700,
          letterSpacing: "0.8px",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: !value && !disabled ? "inset 0 0 10px rgba(80, 130, 170, 0.15)" : "none",
          textTransform: "uppercase",
        }}
      >
        {inactiveLabel}
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
  disabled = false,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}) {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "280px",
        boxSizing: "border-box",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span
        style={{
          width: "36px",
          textAlign: "right",
          fontFamily: "monospace",
          fontSize: "12px",
          fontWeight: 700,
          color: disabled ? "#64748b" : "#ffffff",
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
          disabled={disabled}
          onChange={(e) => !disabled && onChange(parseFloat(e.target.value))}
          style={{
            width: "100%",
            appearance: "none",
            WebkitAppearance: "none",
            height: "3px",
            borderRadius: "2px",
            background: disabled
              ? `linear-gradient(to right, #475569 0%, #475569 ${percent}%, #232c3d ${percent}%, #232c3d 100%)`
              : `linear-gradient(to right, #0084ff 0%, #0084ff ${percent}%, #d1d5db ${percent}%, #d1d5db 100%)`,
            outline: "none",
            cursor: disabled ? "not-allowed" : "pointer",
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
  disabled = false,
}: {
  valH: number;
  valV: number;
  isLinked: boolean;
  onToggleLink: () => void;
  onChangeH: (v: number) => void;
  onChangeV: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const percentH = Math.min(100, Math.max(0, ((valH - min) / (max - min)) * 100));
  const percentV = Math.min(100, Math.max(0, ((valV - min) / (max - min)) * 100));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        width: "280px",
        boxSizing: "border-box",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span
        style={{
          width: "16px",
          textAlign: "right",
          fontFamily: "monospace",
          fontSize: "12px",
          fontWeight: 700,
          color: disabled ? "#64748b" : "#fff",
          flexShrink: 0,
        }}
      >
        {valH}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={valH}
        disabled={disabled}
        onChange={(e) => {
          if (disabled) return;
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
          background: disabled
            ? `linear-gradient(to right, #475569 0%, #475569 ${percentH}%, #232c3d ${percentH}%, #232c3d 100%)`
            : `linear-gradient(to right, #0084ff 0%, #0084ff ${percentH}%, #d1d5db ${percentH}%, #d1d5db 100%)`,
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          margin: 0,
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onToggleLink()}
        title={isLinked ? "Separar longitud vertical y horizontal" : "Vincular longitud"}
        style={{
          width: "28px",
          height: "26px",
          borderRadius: "3px",
          border: isLinked ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.12)",
          background: isLinked ? "#2f3442" : "#222630",
          color: disabled ? "#4b5563" : isLinked ? "#e2e8f0" : "#64748b",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          padding: 0,
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
      <span
        style={{
          width: "16px",
          textAlign: "right",
          fontFamily: "monospace",
          fontSize: "12px",
          fontWeight: 700,
          color: disabled ? "#64748b" : "#fff",
          flexShrink: 0,
        }}
      >
        {valV}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={valV}
        disabled={disabled}
        className={isLinked ? "linked-secondary-slider" : undefined}
        onChange={(e) => {
          if (disabled) return;
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
          background: disabled
            ? `linear-gradient(to right, #475569 0%, #475569 ${percentV}%, #232c3d ${percentV}%, #232c3d 100%)`
            : isLinked
            ? `linear-gradient(to right, #94a3b8 0%, #94a3b8 ${percentV}%, #d1d5db ${percentV}%, #d1d5db 100%)`
            : `linear-gradient(to right, #0084ff 0%, #0084ff ${percentV}%, #d1d5db ${percentV}%, #d1d5db 100%)`,
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          margin: 0,
        }}
      />
    </div>
  );
}

export function ColorPickerRow({
  color,
  onChange,
  disabled = false,
}: {
  color: string;
  onChange: (c: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", opacity: disabled ? 0.45 : 1 }}>
      <div
        style={{
          display: "flex",
          width: "280px",
          height: "34px",
          borderRadius: "2px",
          overflow: "hidden",
          border: disabled ? "1px solid rgba(0, 0, 0, 0.2)" : "1px solid rgba(0, 0, 0, 0.5)",
          boxSizing: "border-box",
        }}
      >
        {/* Color Swatch */}
        <div
          onClick={() => !disabled && setOpen(!open)}
          style={{
            width: "55px",
            background: color,
            cursor: disabled ? "not-allowed" : "pointer",
            borderRight: "1px solid rgba(0, 0, 0, 0.4)",
          }}
          title={disabled ? undefined : "Click to select color"}
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
            color: disabled ? "#64748b" : "#ffffff",
            letterSpacing: "0.5px",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {color.toUpperCase()}
        </div>

        {/* Dropdown Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
          style={{
            width: "110px",
            background: "#2f3442",
            border: "none",
            color: disabled ? "#64748b" : "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <span>Custom</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Popover Dropdown */}
      {open && !disabled && (
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
