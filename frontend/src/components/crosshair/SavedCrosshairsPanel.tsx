"use client";

import { useLanguage } from "@/context/LanguageContext";
import { parseValorantCode } from "@/data/crosshairData";
import type { SavedCrosshair } from "@/lib/savedCrosshairs";

interface SavedCrosshairsPanelProps {
  savedCrosshairs: SavedCrosshair[];
  /** Código de la mira que se está editando, para marcarla en la lista */
  currentCode: string;
  onLoad: (code: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Lista de miras guardadas en localStorage, con botones para cargarlas en el
 * editor o borrarlas.
 */
export function SavedCrosshairsPanel({
  savedCrosshairs,
  currentCode,
  onLoad,
  onDelete,
}: SavedCrosshairsPanelProps) {
  const { t, language } = useLanguage();
  const locale = language === "es" ? "es-ES" : "en-US";

  return (
    <div
      style={{
        background: "rgba(16, 22, 34, 0.85)",
        border: "1px solid var(--border-cyber)",
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.5px",
          color: "var(--text-main)",
        }}
      >
        <span>{t.crosshairSavedTitle}</span>
        <span style={{ color: "var(--text-muted)" }}>{savedCrosshairs.length}</span>
      </div>

      {savedCrosshairs.length === 0 ? (
        <p style={{ fontSize: "11.5px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
          {t.crosshairSavedEmpty}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "260px", overflowY: "auto" }}>
          {savedCrosshairs.map((item) => {
            const color = parseValorantCode(item.code)?.color || "#ffffff";
            const isCurrent = item.code === currentCode;
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  background: isCurrent ? "rgba(56, 189, 248, 0.12)" : "rgba(0, 0, 0, 0.25)",
                  border: isCurrent ? "1px solid var(--color-cyan)" : "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "3px",
                    background: color,
                    flexShrink: 0,
                    border: "1px solid rgba(0, 0, 0, 0.5)",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span
                    title={item.code}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10.5px",
                      color: "#f8fafc",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.code}
                  </span>
                  <span style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                    {new Date(item.savedAt).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <button
                  type="button"
                  className="cyber-btn-secondary"
                  onClick={() => onLoad(item.code)}
                  style={{ padding: "4px 9px", fontSize: "10px", fontWeight: 700 }}
                >
                  {t.crosshairLoad}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  style={{
                    padding: "4px 9px",
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "4px",
                    background: "rgba(220, 38, 38, 0.15)",
                    border: "1px solid rgba(220, 38, 38, 0.5)",
                    color: "#fca5a5",
                    cursor: "pointer",
                  }}
                >
                  {t.crosshairDelete}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
