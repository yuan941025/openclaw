import type {
  ContentGenerationRequest,
  ContentGenerationResponse,
  ContentLLMProvider,
} from "./llm_provider.ts";

type FetchResponseLike = {
  ok: boolean;
  status?: number;
  json: () => Promise<ResponsesApiPayload>;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<FetchResponseLike>;

type LiveContentLLMProviderOptions = {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
};

type ResponsesApiOutputTextItem = {
  type?: string;
  text?: string;
};

type ResponsesApiMessage = {
  type?: string;
  content?: ResponsesApiOutputTextItem[];
};

type ResponsesApiPayload = {
  output_text?: string;
  output?: ResponsesApiMessage[];
  error?: {
    message?: string;
  };
};

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-5.4-mini";

function extractContent(payload: ResponsesApiPayload): string | null {
  if (typeof payload.output_text === "string" && payload.output_text.trim().length > 0) {
    return payload.output_text.trim();
  }

  for (const item of payload.output ?? []) {
    if (item.type !== "message") {
      continue;
    }
    for (const contentItem of item.content ?? []) {
      if (
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string" &&
        contentItem.text.trim().length > 0
      ) {
        return contentItem.text.trim();
      }
    }
  }

  return null;
}

export function createLiveContentLLMProvider(
  options: LiveContentLLMProviderOptions = {},
): ContentLLMProvider {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const baseUrl = options.baseUrl ?? process.env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL;
  const fetchImpl: FetchLike =
    options.fetchImpl ??
    (async (input: string, init?: RequestInit) =>
      fetch(input, init) as Promise<FetchResponseLike>);

  return {
    async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
      if (!apiKey.trim()) {
        throw new Error("OPENAI_API_KEY is required for the live content provider.");
      }

      const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: request.prompt,
          text: {
            format: {
              type: "text",
            },
          },
        }),
      });

      const payload = (await response.json()) as ResponsesApiPayload;

      if (!response.ok) {
        throw new Error(payload.error?.message ?? `live provider request failed (${response.status})`);
      }

      const content = extractContent(payload);

      if (!content) {
        throw new Error("live provider returned no text content.");
      }

      return { content };
    },
  };
}
