import { analyzeCandidates } from "./analysis_engine.ts";
import { formatTradingReport, type TradingFormattedReport } from "./formatter.ts";
import { mockMarketDataProvider, type MarketDataProvider } from "./market_data_provider.ts";
import { screenCandidates, type ScreenCriteria } from "./screener.ts";
import { buildTradingAdviceList, type TradingAdvice } from "./trading_advisor.ts";

export type TradingAnalysisOutput = {
  results: TradingAdvice[];
  formatted: TradingFormattedReport;
};

export type TradingOrchestratorOptions = {
  symbols?: string[];
  screenCriteria?: ScreenCriteria;
  marketDataProvider?: MarketDataProvider;
};

export async function runTradingAnalysis(
  options: TradingOrchestratorOptions = {},
): Promise<TradingAnalysisOutput> {
  const marketDataProvider = options.marketDataProvider ?? mockMarketDataProvider;
  const marketData = await marketDataProvider(options.symbols);
  const candidates = screenCandidates(marketData, options.screenCriteria);
  const analyzedCandidates = analyzeCandidates(candidates);
  const results = buildTradingAdviceList(analyzedCandidates);

  return {
    results,
    formatted: formatTradingReport(results),
  };
}
