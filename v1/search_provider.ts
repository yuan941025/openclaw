import type { SearchCandidate, SearchInput, SearchProvider } from "./types.ts";

type SearchCatalogEntry = SearchCandidate & {
  keywords: string[];
};

const SEARCH_CATALOG: SearchCatalogEntry[] = [
  {
    projectName: "SMB Lead Generation Sprint",
    summary: "Short outbound lead generation package for local service businesses.",
    feasibility: "high",
    returnLevel: "medium",
    reason: "Clear buyer profile, fast offer setup, and easy first validation.",
    lowValue: false,
    keywords: ["lead", "generation", "local", "service", "smb", "outbound", "sales"],
  },
  {
    projectName: "Local SEO Setup Offer",
    summary: "Basic local SEO setup and optimization offer for location-based businesses.",
    feasibility: "high",
    returnLevel: "medium",
    reason: "Clear pain point and repeatable setup process for local operators.",
    lowValue: false,
    keywords: ["seo", "local", "business", "traffic", "google", "maps", "service"],
  },
  {
    projectName: "Simple CRM Cleanup Service",
    summary: "Structured CRM cleanup and pipeline reset service for small teams.",
    feasibility: "medium",
    returnLevel: "medium",
    reason: "Operational pain is common and the service can be scoped cleanly.",
    lowValue: false,
    keywords: ["crm", "cleanup", "pipeline", "sales", "ops", "b2b", "team"],
  },
  {
    projectName: "Low Margin Custom Build",
    summary: "Custom build work with unclear buyer and weak upside.",
    feasibility: "low",
    returnLevel: "low",
    reason: "High delivery cost and poor payoff profile.",
    lowValue: true,
    keywords: ["custom", "build", "cheap", "low", "margin", "unclear"],
  },
];

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function scoreEntry(entry: SearchCatalogEntry, terms: Set<string>): number {
  return entry.keywords.reduce((score, keyword) => score + (terms.has(keyword) ? 1 : 0), 0);
}

export const searchCatalogProvider: SearchProvider = async (
  input: SearchInput,
): Promise<SearchCandidate[]> => {
  const terms = new Set([
    ...tokenize(input.query),
    ...tokenize(input.marketScope ?? ""),
  ]);

  if (terms.size === 0) {
    return [];
  }

  return SEARCH_CATALOG.map((entry) => ({
    entry,
    score: scoreEntry(entry, terms),
  }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ entry }) => ({
      projectName: entry.projectName,
      summary: entry.summary,
      feasibility: entry.feasibility,
      returnLevel: entry.returnLevel,
      reason: entry.reason,
      lowValue: entry.lowValue,
    }));
};
