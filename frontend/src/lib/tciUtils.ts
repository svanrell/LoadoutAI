/**
 * Tactical Combat Index (TCI) Utilities
 * Escala matemática continua de 0.0 a 10.0 con Grados Militares (S+, S, A, B, C, F)
 */

export type TciGrade = "S+" | "S" | "A" | "B" | "C" | "F";

export interface TciMeta {
  tci: number;
  grade: TciGrade;
  label: string;
  color: string;
  bg: string;
  border: string;
}

export function calculateTci(winRate: number): number {
  const raw = 10.0 / (1.0 + Math.exp(-0.08 * (winRate - 50.0)));
  return Math.round(Math.max(0.5, Math.min(9.9, raw)) * 10) / 10;
}

export function getTciMeta(tciValueOrWinrate: number, isWinRate: boolean = false): TciMeta {
  const tci = isWinRate ? calculateTci(tciValueOrWinrate) : tciValueOrWinrate;

  if (tci >= 8.5) {
    return {
      tci,
      grade: "S+",
      label: "Radiant Core",
      color: "#ffd700",
      bg: "rgba(255, 215, 0, 0.15)",
      border: "rgba(255, 215, 0, 0.4)",
    };
  }
  if (tci >= 7.3) {
    return {
      tci,
      grade: "S",
      label: "Tactical Mastery",
      color: "#00ff88",
      bg: "rgba(0, 255, 136, 0.14)",
      border: "rgba(0, 255, 136, 0.35)",
    };
  }
  if (tci >= 6.0) {
    return {
      tci,
      grade: "A",
      label: "Optimized",
      color: "#00f3ff",
      bg: "rgba(0, 243, 255, 0.12)",
      border: "rgba(0, 243, 255, 0.3)",
    };
  }
  if (tci >= 4.8) {
    return {
      tci,
      grade: "B",
      label: "Standard",
      color: "#c5d1de",
      bg: "rgba(197, 209, 222, 0.1)",
      border: "rgba(197, 209, 222, 0.25)",
    };
  }
  if (tci >= 3.6) {
    return {
      tci,
      grade: "C",
      label: "Deficit",
      color: "#ff9900",
      bg: "rgba(255, 153, 0, 0.15)",
      border: "rgba(255, 153, 0, 0.4)",
    };
  }
  return {
    tci,
    grade: "F",
    label: "Breakdown",
    color: "#ff4655",
    bg: "rgba(255, 70, 85, 0.18)",
    border: "rgba(255, 70, 85, 0.45)",
  };
}
