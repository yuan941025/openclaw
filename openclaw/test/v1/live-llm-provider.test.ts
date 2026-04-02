import { describe, expect, it, vi } from "vitest";
import { createLiveContentLLMProvider } from "../../v1/live_llm_provider.ts";

describe("createLiveContentLLMProvider", () => {
  it("throws a clear error when OPENAI_API_KEY is missing", async () => {
    const provider = createLiveContentLLMProvider({
      apiKey: "",
      fetchImpl: vi.fn(),
    });

    await expect(
      provider.generateContent({
        taskDescription: "Write landing page copy",
        assignedAgent: "writer",
        prompt: "Write landing page copy",
      }),
    ).rejects.toThrow("OPENAI_API_KEY is required for the live content provider.");
  });

  it("returns text content from a mocked responses api call", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        output_text: "Generated live content",
      }),
    }));

    const provider = createLiveContentLLMProvider({
      apiKey: "test-key",
      fetchImpl,
    });

    const result = await provider.generateContent({
      taskDescription: "Write landing page copy",
      assignedAgent: "writer",
      prompt: "Write landing page copy",
    });

    expect(result).toEqual({
      content: "Generated live content",
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
