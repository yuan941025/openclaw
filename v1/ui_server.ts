import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createContentTaskRunner } from "./content_task_runner.ts";
import {
  createDefaultContentProvider,
  type ContentProviderMode,
} from "./default_content_provider.ts";
import type { ContentLLMProvider } from "./llm_provider.ts";
import {
  getLobsterBrainPanelCopy,
  getLobsterBrainSummary,
  loadLobsterBrain,
} from "./lobster_brain.ts";
import { runExecutionStage, runProposalStage } from "./orchestrator.ts";
import { searchCatalogProvider } from "./search_provider.ts";
import { runSelfBuildPlanning } from "./self_build/self_build_orchestrator.ts";
import type { SearchProvider } from "./types.ts";

type UiRunRequestBody = {
  query?: string;
  marketScope?: string | null;
  authorization?: unknown;
};

type UiServerOptions = {
  port?: number;
  searchProvider?: SearchProvider;
  contentProvider?: ContentLLMProvider;
  providerMode?: ContentProviderMode;
};

type SelfBuildResult = Awaited<ReturnType<typeof runSelfBuildPlanning>>;
type SelfBuildStatus = "idle" | "running" | "ok";

type SelfBuildState = {
  status: SelfBuildStatus;
  running: boolean;
  result: SelfBuildResult | null;
  last_run_at: string | null;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UI_DIR = join(__dirname, "ui");

function json(response: ServerResponse, statusCode: number, body: unknown) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw) as unknown;
}

function parseAuthorization(input: unknown): unknown {
  if (typeof input === "string") {
    return JSON.parse(input) as unknown;
  }
  return input;
}

function createInitialSelfBuildState(): SelfBuildState {
  return {
    status: "idle",
    running: false,
    result: null,
    last_run_at: null,
  };
}

export function createV1UiServer(options: UiServerOptions = {}) {
  const brain = loadLobsterBrain();
  const brainSummary = getLobsterBrainSummary();
  const brainPanels = getLobsterBrainPanelCopy();
  const providerSelection =
    options.contentProvider && options.providerMode
      ? {
          provider: options.contentProvider,
          mode: options.providerMode,
        }
      : createDefaultContentProvider();
  const searchProvider = options.searchProvider ?? searchCatalogProvider;
  const selfBuildState = createInitialSelfBuildState();

  async function runSelfBuildLoop(): Promise<SelfBuildResult> {
    return runSelfBuildPlanning({
      goal: "build the lobster mother system self-build loop",
    });
  }

  function getStableSelfBuildStatus(): SelfBuildStatus {
    return selfBuildState.result ? "ok" : "idle";
  }

  const server = createServer(async (request, response) => {
    const method = request.method ?? "GET";
    const url = request.url ?? "/";

    try {
      if (method === "GET" && url === "/") {
        const html = await readFile(join(UI_DIR, "index.html"), "utf8");
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(html);
        return;
      }

      if (method === "GET" && url === "/app.js") {
        const js = await readFile(join(UI_DIR, "app.js"), "utf8");
        response.writeHead(200, {
          "Content-Type": "application/javascript; charset=utf-8",
        });
        response.end(js);
        return;
      }

      if (method === "GET" && url === "/api/status") {
        json(response, 200, {
          providerMode: providerSelection.mode,
          brain: {
            name: brain.identity.name,
            role: brain.identity.role,
            currentPriority: brain.identity.currentPriority,
            currentVersionTrack: brain.roadmap.versions[1],
            summary: brainSummary,
            panels: brainPanels,
          },
        });
        return;
      }

      if (method === "GET" && url === "/api/trading/run") {
        const { runTradingAnalysis } = await import("./trading/trading_orchestrator.ts");
        const tradingResult = await runTradingAnalysis();

        json(response, 200, {
          providerMode: providerSelection.mode,
          analysis: tradingResult.results,
          formatted: tradingResult.formatted,
        });
        return;
      }

      if (method === "POST" && url === "/api/proposal") {
        const body = (await readJsonBody(request)) as UiRunRequestBody;
        const proposalStage = await runProposalStage({
          input: {
            query: body.query ?? "",
            marketScope: body.marketScope ?? null,
          },
          search: searchProvider,
        });

        json(response, 200, {
          providerMode: providerSelection.mode,
          proposal: proposalStage.proposals,
        });
        return;
      }

      if (method === "GET" && url === "/api/self-build/status") {
        json(response, 200, selfBuildState);
        return;
      }

      if (method === "POST" && url === "/api/self-build/run") {
        if (selfBuildState.running) {
          json(response, 409, { status: "busy" });
          return;
        }

        selfBuildState.status = "running";
        selfBuildState.running = true;

        try {
          const result = await runSelfBuildLoop();

          selfBuildState.result = result;
          selfBuildState.last_run_at = new Date().toISOString();
          selfBuildState.status = "ok";
          selfBuildState.running = false;

          json(response, 200, { status: "ok" });
          return;
        } catch (error: unknown) {
          selfBuildState.status = getStableSelfBuildStatus();
          selfBuildState.running = false;

          json(response, 500, {
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
          return;
        }
      }

      if (method === "POST" && url === "/api/run") {
        const body = (await readJsonBody(request)) as UiRunRequestBody;
        const proposalStage = await runProposalStage({
          input: {
            query: body.query ?? "",
            marketScope: body.marketScope ?? null,
          },
          search: searchProvider,
        });
        const executionStage = await runExecutionStage({
          authorizedInput: parseAuthorization(body.authorization),
          runTask: createContentTaskRunner(providerSelection.provider),
        });

        json(response, 200, {
          providerMode: providerSelection.mode,
          proposal: proposalStage.proposals,
          executionReport: executionStage.report,
        });
        return;
      }

      json(response, 404, { error: "not found" });
    } catch (error: unknown) {
      json(response, 400, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return {
    providerMode: providerSelection.mode,
    listen(port = options.port ?? 3013) {
      return new Promise<{ server: typeof server; port: number }>((resolve) => {
        server.listen(port, () => {
          const address = server.address();
          const actualPort =
            typeof address === "object" && address && "port" in address ? address.port : port;
          resolve({ server, port: actualPort });
        });
      });
    },
    close() {
      return new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

async function main() {
  const app = createV1UiServer();
  const { port } = await app.listen();
  console.log(`V1 UI server running at http://localhost:${port}`);
  console.log(`Provider mode: ${app.providerMode}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
