import type { MarketSnapshot } from "./market_data_provider.ts";

export type Candidate = MarketSnapshot;

export type ScreenCriteria = {
  minVolume?: number;
  minAbsChange24h?: number;
  limit?: number;
};

const DEFAULT_SCREEN_CRITERIA: Required<ScreenCriteria> = {
  minVolume: 25_000_000,
  minAbsChange24h: 2,
  limit: 6,
};

export function screenCandidates(
  marketData: MarketSnapshot[],
  criteria: ScreenCriteria = {},
): Candidate[] {
  const threshold = {
    minVolume: criteria.minVolume ?? DEFAULT_SCREEN_CRITERIA.minVolume,
    minAbsChange24h: criteria.minAbsChange24h ?? DEFAULT_SCREEN_CRITERIA.minAbsChange24h,
    limit: criteria.limit ?? DEFAULT_SCREEN_CRITERIA.limit,
  };

  return marketData
    .filter(
      (snapshot) =>
        snapshot.volume >= threshold.minVolume &&
        Math.abs(snapshot.change_24h) >= threshold.minAbsChange24h,
    )
    .sort((left, right) => {
      const volatilityDelta = Math.abs(right.change_24h) - Math.abs(left.change_24h);
      if (volatilityDelta !== 0) {
        return volatilityDelta;
      }
      return right.volume - left.volume;
    })
    .slice(0, threshold.limit);
}
