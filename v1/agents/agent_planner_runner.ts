import { fileURLToPath } from "node:url";
import { runAgentPlanning } from "./agent_planner.ts";

const DEFAULT_GOAL =
  "Plan and build a self-build agent execution module with controlled external operation.";

function parseGoal(argv: string[]): string {
  return argv.join(" ").trim() || DEFAULT_GOAL;
}

async function main() {
  const goal = parseGoal(process.argv.slice(2));
  const plan = runAgentPlanning(goal);

  console.log("=== AGENT PLAN ===");
  console.log(JSON.stringify(plan, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
