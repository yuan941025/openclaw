import type { TradingAction, TradingAdvice } from "./trading_advisor.ts";

export type TradingFormattedReport = {
  ig: string;
  report: string;
  short: string;
};

function actionLabel(action: TradingAction): string {
  if (action === "consider_buy") {
    return "\u8003\u616e\u8cb7\u5165";
  }
  if (action === "watch") {
    return "\u5148\u89c0\u5bdf";
  }
  return "\u907f\u514d\u9032\u5834";
}

function formatIgPost(results: TradingAdvice[]): string {
  if (results.length === 0) {
    return [
      "\u4eca\u65e5AI\u5e02\u5834\u89c0\u5bdf",
      "\u76ee\u524d\u6c92\u6709\u7b26\u5408\u689d\u4ef6\u7684\u6a19\u7684\u3002",
      "",
      "\u975e\u6295\u8cc7\u5efa\u8b70",
    ].join("\n");
  }

  return [
    "\u4eca\u65e5AI\u5e02\u5834\u89c0\u5bdf",
    "",
    ...results.flatMap((result) => [
      `${result.symbol}\uff5c${actionLabel(result.action)}`,
      `\u9032\u5834\uff1a${result.entry_range}`,
      `\u505c\u640d\uff1a${result.stop_loss}`,
      `\u505c\u5229\uff1a${result.take_profit}`,
      "",
    ]),
    "\u975e\u6295\u8cc7\u5efa\u8b70",
  ].join("\n");
}

function formatClientReport(results: TradingAdvice[]): string {
  if (results.length === 0) {
    return [
      "AI \u5e02\u5834\u5206\u6790\u5831\u544a",
      "- \u672c\u8f2a\u7be9\u9078\u5f8c\uff0c\u66ab\u7121\u7b26\u5408\u689d\u4ef6\u7684\u6a19\u7684\u3002",
      "- \u5efa\u8b70\u7dad\u6301\u89c0\u5bdf\uff0c\u7b49\u5f85\u91cf\u80fd\u8207\u6ce2\u52d5\u7d50\u69cb\u66f4\u6e05\u695a\u5f8c\u518d\u66f4\u65b0\u5224\u65b7\u3002",
      "- \u672c\u5831\u544a\u50c5\u4f9b\u53c3\u8003\uff0c\u975e\u6295\u8cc7\u5efa\u8b70\u3002",
    ].join("\n");
  }

  return [
    "AI \u5e02\u5834\u5206\u6790\u5831\u544a",
    ...results.flatMap((result) => [
      `- ${result.symbol}\uff5c${actionLabel(result.action)}`,
      `  \u9032\u5834\u5340\u9593\uff1a${result.entry_range}`,
      `  \u505c\u640d\u4f4d\u7f6e\uff1a${result.stop_loss}`,
      `  \u505c\u5229\u4f4d\u7f6e\uff1a${result.take_profit}`,
      `  \u9867\u554f\u8aaa\u660e\uff1a${result.explanation}`,
    ]),
    "- \u672c\u5831\u544a\u50c5\u4f9b\u53c3\u8003\uff0c\u975e\u6295\u8cc7\u5efa\u8b70\u3002",
  ].join("\n");
}

function formatShortMessage(results: TradingAdvice[]): string {
  if (results.length === 0) {
    return "\u4eca\u65e5\u7121\u7b26\u5408\u689d\u4ef6\u6a19\u7684\uff0c\u975e\u6295\u8cc7\u5efa\u8b70";
  }

  return results
    .map(
      (result) =>
        `${result.symbol}\uff5c${actionLabel(result.action)}\uff5c\u9032\u5834 ${result.entry_range}\uff5c\u505c\u640d ${result.stop_loss}\uff5c\u505c\u5229 ${result.take_profit}`,
    )
    .join("\n");
}

export function formatTradingReport(results: TradingAdvice[]): TradingFormattedReport {
  return {
    ig: formatIgPost(results),
    report: formatClientReport(results),
    short: formatShortMessage(results),
  };
}
