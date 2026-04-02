import { describe, expect, it } from "vitest";
import { searchCatalogProvider } from "../../v1/search_provider.ts";

describe("searchCatalogProvider", () => {
  it("returns matched candidates from user-provided search input", async () => {
    const results = await searchCatalogProvider({
      query: "local service lead generation",
      marketScope: "Taiwan SMB",
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.projectName).toBe("SMB Lead Generation Sprint");
    expect(results.some((item) => item.projectName === "Local SEO Setup Offer")).toBe(true);
  });

  it("returns an empty list when nothing matches the provided scope", async () => {
    const results = await searchCatalogProvider({
      query: "quantum algae moonbase",
      marketScope: null,
    });

    expect(results).toEqual([]);
  });
});
