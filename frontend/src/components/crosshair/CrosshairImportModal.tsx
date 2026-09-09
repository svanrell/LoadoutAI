"use client";

import { useState } from "react";

interface CrosshairImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (code: string) => void;
}

export function CrosshairImportModal({
  isOpen,
  onClose,
  onImport,
}: CrosshairImportModalProps) {
  const [importInput, setImportInput] = useState("");

  if (!isOpen) return null;

  const handleApply = () => {
    if (importInput.trim()) {
      onImport(importInput.trim());
      setImportInput("");
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1d25",
          border: "1px solid #2d3340",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "500px",
          padding: "20px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>
            Import Crosshair Profile
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#8c94a2",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
          Paste your Valorant crosshair code (e.g. <code>0;P;c;8;u;00FFB3;h;0;b;1</code>):
        </p>

        <textarea
          rows={3}
          value={importInput}
          onChange={(e) => setImportInput(e.target.value)}
          placeholder="0;P;c;8;u;00FFB3;h;0;b;1..."
          style={{
            width: "100%",
            padding: "10px",
            background: "#11141b",
            border: "1px solid #2d3340",
            borderRadius: "4px",
            color: "#38bdf8",
            fontFamily: "monospace",
            fontSize: "12px",
            outline: "none",
            boxSizing: "border-box",
            resize: "none",
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: "4px",
              background: "#2a2f3a",
              border: "none",
              color: "#e5e7eb",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            style={{
              padding: "8px 18px",
              borderRadius: "4px",
              background: "#16a34a",
              border: "none",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
