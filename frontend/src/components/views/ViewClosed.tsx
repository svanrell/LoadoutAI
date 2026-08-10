"use client";

import { useGameState } from "@/hooks/useGameState";

export default function ViewClosed() {
  const { setView } = useGameState();

  return (
    <div id="viewClosed" className="state-view active">
      <div className="cyber-panel offline-card">
        <div
          className="pulse-red"
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "3px solid var(--color-red)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "10px",
            boxShadow: "0 0 15px var(--glow-red)",
          }}
        >
          <span
            style={{
              fontSize: "30px",
              color: "var(--color-red)",
              fontWeight: "bold",
            }}
          >
            !
          </span>
        </div>
        <div
          className="logo-title"
          style={{ fontSize: "18px", letterSpacing: "1px" }}
        >
          RADAR STATUS:{" "}
          <span
            style={{
              color: "var(--color-red)",
              textShadow: "0 0 8px var(--glow-red)",
            }}
          >
            OFFLINE
          </span>
        </div>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          The local VALORANT client is not running. Please open the game to start live tactical mapping and draft recommendations.
        </p>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "var(--color-cyan)",
            background: "rgba(0,0,0,0.3)",
            padding: "8px 15px",
            borderRadius: "4px",
            border: "1px solid var(--border-cyber)",
            width: "100%",
          }}
        >
          [POLLING RADAR CLIENT GATEWAY...]
        </div>
        <button
          className="lock-btn"
          style={{
            backgroundColor: "var(--color-cyan)",
            boxShadow: "0 2px 10px rgba(0, 240, 255, 0.2)",
            width: "100%",
            marginTop: "10px",
          }}
          onClick={() => setView("pregame")}
        >
          LAUNCH OFFLINE SIMULATOR
        </button>
        <button
          className="lock-btn"
          style={{
            width: "100%",
            backgroundColor: "var(--color-red)",
            boxShadow: "0 2px 10px rgba(255, 70, 85, 0.2)",
          }}
          onClick={() => setView("ingame")}
        >
          LAUNCH IN-GAME OVERLAY (HUD DEMO)
        </button>
      </div>
    </div>
  );
}
