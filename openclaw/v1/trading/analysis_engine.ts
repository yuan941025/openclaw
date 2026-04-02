import type { Candidate } from "./screener.ts";

export type MarketTrend = "up" | "down" | "sideways";
export type RiskLevel = "low" | "medium" | "high";

export type AnalyzedCandidate = Candidate & {
  trend: MarketTrend;
  risk_level: RiskLevel;
  reason: string;
};

function resolveTrend(change24h: number): MarketTrend {
  if (change24h >= 2) {
    return "up";
  }
  if (change24h <= -2) {
    return "down";
  }
  return "sideways";
}

function resolveRiskLevel(candidate: Candidate): RiskLevel {
  const absoluteMove = Math.abs(candidate.change_24h);

  if (absoluteMove >= 7 || candidate.price < 1) {
    return "high";
  }
  if (absoluteMove >= 3) {
    return "medium";
  }
  return "low";
}

function buildReason(candidate: Candidate, trend: MarketTrend, riskLevel: RiskLevel): string {
  const directionText =
    trend === "up"
      ? "Momentum is positive over the last 24 hours."
      : trend === "down"
        ? "Price has weakened over the last 24 hours."
        : "Price is moving sideways without a strong 24-hour direction.";

  return [
    `${candidate.symbol} moved ${candidate.change_24h.toFixed(2)}% in 24h on volume ${candidate.volume.toLocaleString()}.`,
    directionText,
    `Current risk is ${riskLevel} based on the size of the move and the price level.`,
  ].join(" ");
}

export function analyzeCandidates(candidates: Candidate[]): AnalyzedCandidate[] {
  return candidates.map((candidate) => {
    const trend = resolveTrend(candidate.change_24h);
    const riskLevel = resolveRiskLevel(candidate);

    return {
      ...candidate,
      trend,
      risk_level: riskLevel,
      reason: buildReason(candidate, trend, riskLevel),
    };
  });
}
