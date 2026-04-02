import { runSelfBuildPlanning } from "./openclaw/v1/self_build/self_build_orchestrator";

async function main() {
  const result = runSelfBuildPlanning(
    "build a self-building lobster agent",
  );

  if (
    !result.goal_summary ||
    !result.current_capabilities ||
    !result.missing_capabilities ||
    !result.proposed_modules ||
    !result.build_order
  ) {
    throw new Error("self_build smoke failed");
  }

  console.log("self_build smoke passed");
  console.log(JSON.stringify(result, null, 2));
}

main();
