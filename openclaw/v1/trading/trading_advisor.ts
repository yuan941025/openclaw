import type { AnalyzedCandidate } from "./analysis_engine.ts";

export type TradingAction = "watch" | "consider_buy" | "avoid";

export type TradingAdvice = {
  symbol: string;
  price: number;
  trend: AnalyzedCandidate["trend"];
  risk_level: AnalyzedCandidate["risk_level"];
  action: TradingAction;
  entry_range: string;
  stop_loss: string;
  take_profit: string;
  explanation: string;
};

function formatPrice(value: number): string {
  if (value >= 1000) {
    return value.toFixed(2);
  }
  if (value >= 1) {
    return value.toFixed(3);
  }
  return value.toFixed(4);
}

function formatRange(min: number, max: number): string {
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

function resolveAction(candidate: AnalyzedCandidate): TradingAction {
  if (candidate.trend === "down" || candidate.risk_level === "high") {
    return "avoid";
  }
  if (candidate.trend === "up" && candidate.risk_level !== "high") {
    return "consider_buy";
  }
  return "watch";
}

function buildGuidance(candidate: AnalyzedCandidate, action: TradingAction) {
  if (action === "consider_buy") {
    return {
      entry_range: formatRange(candidate.price * 0.985, candidate.price * 1.01),
      stop_loss: formatPrice(candidate.price * 0.95),
      take_profit: formatPrice(candidate.price * 1.08),
      explanation: [
        candidate.reason,
        "Momentum is constructive and risk is still manageable, so this stays in consider_buy rather than a direct order.",
        "This is analysis only and does not guarantee profit.",
      ].join(" "),
    };
  }

  if (action === "watch") {
    return {
      entry_range: formatRange(candidate.price * 0.97, candidate.price * 1.03),
      stop_loss: formatPrice(candidate.price * 0.96),
      take_profit: formatPrice(candidate.price * 1.05),
      explanation: [
        candidate.reason,
        "The setup is not strong enough for a buy suggestion yet, so the safer move is to watch for confirmation.",
        "This is analysis only and does not guarantee profit.",
      ].join(" "),
    };
  }

  return {
    entry_range: "No entry suggested",
    stop_loss: "N/A",
    take_profit: "N/A",
    explanation: [
      candidate.reason,
      "The current move or risk profile is too weak for a constructive setup, so the safer suggestion is avoid.",
      "This is analysis only and does not guarantee profit.",
    ].join(" "),
  };
}

export function buildTradingAdvice(candidate: AnalyzedCandidate): TradingAdvice {
  const action = resolveAction(candidate);
  const guidance = buildGuidance(candidate, action);

  return {
    symbol: candidate.symbol,
    price: candidate.price,
    trend: candidate.trend,
    risk_level: candidate.risk_level,
    action,
    entry_range: guidance.entry_range,
    stop_loss: guidance.stop_loss,
    take_profit: guidance.take_profit,
    explanation: guidance.explanation,
  };
}

export function buildTradingAdviceList(candidates: AnalyzedCandidate[]): TradingAdvice[] {
  return candidates.map(buildTradingAdvice);
}
