import type { Session } from "./types";

export function sessionAverage(s: Session): number | null {
  const scores = s.questions.map((q) => q.feedback?.score).filter((n): n is number => typeof n === "number");
  if (!scores.length) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export function scoreTone(score: number) {
  if (score >= 8) return "good";
  if (score >= 6) return "ok";
  return "low";
}
