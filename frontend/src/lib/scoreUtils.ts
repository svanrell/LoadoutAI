/**
 * Utilidades de Puntuación Táctica (Escala continua 0.0 - 10.0 con Grados S+, S, A, B, C, F)
 */

export type ScoreGrade = "S+" | "S" | "A" | "B" | "C" | "F";

export interface ScoreMeta {
  score: number;
  grade: ScoreGrade;
  label: string;
  color: string;
  bg: string;
  border: string;
}

export function calculateScore(winRate: number): number {
  const raw = 10.0 / (1.0 + Math.exp(-0.08 * (winRate - 50.0)));
  return Math.round(Math.max(0.5, Math.min(9.9, raw)) * 10) / 10;
}

export function getScoreMeta(
  scoreValueOrWinrate: number,
  isWinRate: boolean = false,
  lang: "es" | "en" = "es"
): ScoreMeta {
  const score = isWinRate ? calculateScore(scoreValueOrWinrate) : scoreValueOrWinrate;

  if (score >= 8.5) {
    return {
      score,
      grade: "S+",
      label: lang === "es" ? "Núcleo Radiante" : "Radiant Core",
      color: "#ffd700",
      bg: "rgba(255, 215, 0, 0.15)",
      border: "rgba(255, 215, 0, 0.4)",
    };
  }
  if (score >= 7.3) {
    return {
      score,
      grade: "S",
      label: lang === "es" ? "Dominio Táctico" : "Tactical Mastery",
      color: "#00ff88",
      bg: "rgba(0, 255, 136, 0.14)",
      border: "rgba(0, 255, 136, 0.35)",
    };
  }
  if (score >= 6.0) {
    return {
      score,
      grade: "A",
      label: lang === "es" ? "Optimizado" : "Optimized",
      color: "#00f3ff",
      bg: "rgba(0, 243, 255, 0.12)",
      border: "rgba(0, 243, 255, 0.3)",
    };
  }
  if (score >= 4.8) {
    return {
      score,
      grade: "B",
      label: lang === "es" ? "Estándar" : "Standard",
      color: "#c5d1de",
      bg: "rgba(197, 209, 222, 0.1)",
      border: "rgba(197, 209, 222, 0.25)",
    };
  }
  if (score >= 3.6) {
    return {
      score,
      grade: "C",
      label: lang === "es" ? "Déficit Táctico" : "Deficit",
      color: "#ff9900",
      bg: "rgba(255, 153, 0, 0.15)",
      border: "rgba(255, 153, 0, 0.4)",
    };
  }
  return {
    score,
    grade: "F",
    label: lang === "es" ? "Desbalance" : "Breakdown",
    color: "#ff4655",
    bg: "rgba(255, 70, 85, 0.18)",
    border: "rgba(255, 70, 85, 0.45)",
  };
}
