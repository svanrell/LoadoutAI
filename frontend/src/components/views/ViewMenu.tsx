"use client";

import { useGameState } from "@/hooks/useGameState";

export default function ViewMenu() {
  const { setView } = useGameState();

  return (
    <div id="viewMenu" className="state-view active">
      <div className="cyber-panel lobby-radar-card">
        <div className="radar-ping-container">
          <div className="radar-ring"></div>
          <div className="radar-ring"></div>
          <div className="radar-ping-center"></div>
        </div>
        <div
          className="logo-title"
          style={{ fontSize: "18px", letterSpacing: "1px" }}
        >
          RADAR STATUS:{" "}
          <span
            style={{
              color: "var(--color-cyan)",
              textShadow: "0 0 8px var(--glow-cyan)",
            }}
          >
            STANDBY
          </span>
        </div>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          Riot local client detected. You are currently in menus or queue. Searching for match...
        </p>
        <button
          className="lock-btn"
          style={{
            width: "100%",
            backgroundColor: "var(--color-cyan)",
            boxShadow: "0 2px 10px rgba(0, 240, 255, 0.2)",
          }}
          onClick={() => setView("pregame")}
        >
          OPEN AGENT DRAFT COACH (SANDBOX)
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

      <div className="cyber-panel lobby-cache-card">
        <div
          className="panel-header"
          style={{
            background: "transparent",
            borderBottom: "1px solid var(--border-cyber)",
            padding: "0 0 10px 0",
          }}
        >
          <span>Map Ingestion Cache</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            overflowY: "auto",
            maxHeight: "250px",
            paddingRight: "5px",
          }}
        >
          {[
            { map: "ASCENT", matches: "24,192" },
            { map: "BIND", matches: "18,944" },
            { map: "HAVEN", matches: "15,200" },
            { map: "SPLIT", matches: "12,832" },
            { map: "BREEZE", matches: "9,412" },
            { map: "ICEBOX", matches: "11,048" },
          ].map((item) => (
            <div
              key={item.map}
              style={{
                border: "1px solid var(--border-cyber)",
                padding: "10px",
                borderRadius: "4px",
                fontSize: "11px",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: "bold",
                  color: "var(--color-cyan)",
                }}
              >
                {item.map}
              </div>
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "9px",
                  marginTop: "3px",
                }}
              >
                Aggregated: {item.matches} matches
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
