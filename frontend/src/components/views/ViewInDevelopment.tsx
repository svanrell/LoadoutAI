"use client";

import { useGameState } from "@/hooks/useGameState";
import { useLanguage } from "@/context/LanguageContext";
import { TierListIcon, ToolsIcon } from "@/components/Icons";

interface ViewInDevelopmentProps {
  type: "tierlist" | "tools";
}

export default function ViewInDevelopment({ type }: ViewInDevelopmentProps) {
  const { setView } = useGameState();
  const { t } = useLanguage();

  const isTierList = type === "tierlist";
  const title = isTierList ? t.tierList : t.tools;
  const desc = isTierList ? t.tierListDesc : t.toolsDesc;

  return (
    <div className="state-view active" style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "30px 20px" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "rgba(11, 18, 25, 0.85)",
          border: "1px solid var(--border-cyber)",
          borderRadius: "8px",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              background: "rgba(0, 240, 255, 0.1)",
              border: "1.5px solid var(--color-cyan)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-cyan)",
              boxShadow: "0 0 15px rgba(0, 240, 255, 0.2)",
            }}
          >
            {isTierList ? <TierListIcon size={24} /> : <ToolsIcon size={24} />}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "20px", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                {title.toUpperCase()}
              </h1>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: "rgba(255, 208, 0, 0.15)",
                  border: "1px solid rgba(255, 208, 0, 0.4)",
                  color: "#ffd000",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {t.inDevelopment}
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", marginBottom: 0 }}>
              {desc}
            </p>
          </div>
        </div>

        <button
          className="cyber-btn-secondary"
          onClick={() => setView("menu")}
          style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 700 }}
        >
          {t.backToProfile}
        </button>
      </div>

      {/* Development Base Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={{
            background: "rgba(11, 18, 25, 0.6)",
            border: "1px dashed rgba(0, 240, 255, 0.3)",
            borderRadius: "8px",
            padding: "36px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#ffd000",
              boxShadow: "0 0 10px #ffd000",
              animation: "pulse 2s infinite ease-in-out",
            }}
          />
          <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
            {t.inDevelopment}
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "420px", margin: 0, lineHeight: 1.5 }}>
            {t.inDevelopmentDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
