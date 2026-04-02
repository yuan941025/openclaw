export type MarketSnapshot = {
  symbol: string;
  price: number;
  change_24h: number;
  volume: number;
};

export type MarketDataProvider = (symbols?: string[]) => Promise<MarketSnapshot[]>;

const MOCK_MARKET_DATA: MarketSnapshot[] = [
  { symbol: "AAPL", price: 212.43, change_24h: 1.8, volume: 57_200_000 },
  { symbol: "MSFT", price: 428.11, change_24h: 2.7, volume: 31_400_000 },
  { symbol: "NVDA", price: 119.86, change_24h: 5.9, volume: 288_700_000 },
  { symbol: "TSLA", price: 178.72, change_24h: -4.6, volume: 122_500_000 },
  { symbol: "BTC-USD", price: 86_420.15, change_24h: 3.2, volume: 31_800_000_000 },
  { symbol: "ETH-USD", price: 4_210.44, change_24h: -2.9, volume: 14_600_000_000 },
  { symbol: "SOL-USD", price: 182.17, change_24h: 7.8, volume: 4_980_000_000 },
  { symbol: "XRP-USD", price: 0.71, change_24h: 0.9, volume: 1_240_000_000 },
];

function normalizeSymbols(symbols?: string[]): Set<string> | null {
  const normalized = (symbols ?? [])
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  return normalized.length > 0 ? new Set(normalized) : null;
}

export const mockMarketDataProvider: MarketDataProvider = async (
  symbols,
): Promise<MarketSnapshot[]> => {
  const requestedSymbols = normalizeSymbols(symbols);

  if (!requestedSymbols) {
    return [...MOCK_MARKET_DATA];
  }

  return MOCK_MARKET_DATA.filter((snapshot) => requestedSymbols.has(snapshot.symbol.toUpperCase()));
};
