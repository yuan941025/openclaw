import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createContentTaskRunner } from "./content_task_runner.ts";
import { createDefaultContentProvider } from "./default_content_provider.ts";
import { loadLobsterBrain } from "./lobster_brain.ts";
import { runExecutionStage, runProposalStage } from "./orchestrator.ts";
import { searchCatalogProvider } from "./search_provider.ts";

function printSection(title: string) {
  output.write(`\n=== ${title} ===\n`);
}

async function promptJson<T>(rl: ReturnType<typeof createInterface>, label: string): Promise<T> {
  const raw = await rl.question(`${label}\n> `);
  return JSON.parse(raw) as T;
}

async function main() {
  const rl = createInterface({ input, output });
  const contentProvider = createDefaultContentProvider();
  const brain = loadLobsterBrain();

  try {
    printSection("Lobster Brain");
    output.write(`${brain.identity.name} | ${brain.identity.role}\n`);
    output.write(`Priority: ${brain.identity.currentPriority}\n`);
    output.write(`Track: ${brain.roadmap.versions[0]}\n`);

    printSection("Content Provider");
    output.write(
      contentProvider.mode === "live"
        ? "Using live content provider via OPENAI_API_KEY.\n"
        : "OPENAI_API_KEY not found. Falling back to local content provider.\n",
    );

    printSection("V1 Search Input");
    const query = (await rl.question("Search query\n> ")).trim();
    const marketScopeRaw = (await rl.question("Market scope (optional)\n> ")).trim();

    if (!query && !marketScopeRaw) {
      throw new Error("A search query or market scope is required.");
    }

    const proposalStage = await runProposalStage({
      input: {
        query,
        marketScope: marketScopeRaw || null,
      },
      search: searchCatalogProvider,
    });

    printSection("Proposal Result");
    output.write(`${JSON.stringify(proposalStage.proposals, null, 2)}\n`);

    if (proposalStage.proposals.length === 0) {
      printSection("No Proposal Candidates");
      output.write("No matching candidates were found for the provided search scope.\n");
      return;
    }

    printSection("Authorization JSON");
    const authorizedInput = await promptJson<unknown>(
      rl,
      "Paste the authorized execution JSON payload",
    );

    const executionStage = await runExecutionStage({
      authorizedInput,
      runTask: createContentTaskRunner(contentProvider.provider),
    });

    printSection("Execution Report");
    output.write(`${JSON.stringify(executionStage.report, null, 2)}\n`);
  } finally {
    rl.close();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
