import type { ContentLLMProvider } from "./llm_provider.ts";
import { createLiveContentLLMProvider } from "./live_llm_provider.ts";

export type ContentProviderMode = "live" | "local";

const localContentProvider: ContentLLMProvider = {
  async generateContent(request) {
    return {
      content: [
        `Task: ${request.taskDescription}`,
        `Agent: ${request.assignedAgent}`,
        "Generated content:",
        `Draft content for "${request.taskDescription}".`,
      ].join("\n"),
    };
  },
};

export function createDefaultContentProvider(): {
  provider: ContentLLMProvider;
  mode: ContentProviderMode;
} {
  if (process.env.OPENAI_API_KEY?.trim()) {
    return {
      provider: createLiveContentLLMProvider(),
      mode: "live",
    };
  }

  return {
    provider: localContentProvider,
    mode: "local",
  };
}
