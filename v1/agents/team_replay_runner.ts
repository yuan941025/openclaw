import type {
  AgentExecutionBundleExport,
  CoordinationPlan,
  TeamExecutionSimulation,
  TeamReplayResult,
} from "./agent_types.ts";

type ReplayTeamExecutionInput = {
  executionBundles: AgentExecutionBundleExport;
  simulationResult: TeamExecutionSimulation;
  coordinationPlan: CoordinationPlan;
};

export function findReplayBundle(
  bundles: AgentExecutionBundleExport["bundles"],
  agentId: string,
) {
  return bundles.find((bundle) => bundle.agent_id === agentId);
}

export function isReplayInputSatisfied(
  requiredInput: string,
  completedTaskIds: Set<string>,
  producedArtifacts: Set<string>,
): boolean {
  if (requiredInput === "goal_summary") {
    return true;
  }

  if (requiredInput.startsWith("dependency:")) {
    return completedTaskIds.has(requiredInput.slice("dependency:".length));
  }

  if (requiredInput.startsWith("artifact:")) {
    return producedArtifacts.has(requiredInput.slice("artifact:".length));
  }

  return false;
}

export function replayTeamExecution(
  input: ReplayTeamExecutionInput,
): TeamReplayResult {
  const completedTaskIds = new Set<string>();
  const producedArtifacts = new Set<string>();
  const replaySteps: TeamReplayResult["replay_steps"] = [];

  for (const agentId of input.coordinationPlan.final_execution_order) {
    const bundle = findReplayBundle(input.executionBundles.bundles, agentId);
    const simulationStatus = input.simulationResult.simulated_agent_results.find((result) =>
      result.agent_id === agentId
    );
    if (!bundle) {
      continue;
    }

    const consumedInputs = bundle.required_inputs.filter((requiredInput) =>
      isReplayInputSatisfied(requiredInput, completedTaskIds, producedArtifacts)
    );
    const missingInputs = bundle.required_inputs.filter((requiredInput) =>
      !isReplayInputSatisfied(requiredInput, completedTaskIds, producedArtifacts)
    );
    const isBlocked = simulationStatus?.status === "blocked" || missingInputs.length > 0;

    replaySteps.push({
      step_id: `replay_step_${replaySteps.length + 1}`,
      agent_id: bundle.agent_id,
      consumed_inputs: consumedInputs,
      produced_outputs: isBlocked ? [] : bundle.expected_outputs,
      status: isBlocked ? "blocked" : "replayed",
    });

    if (isBlocked) {
      continue;
    }

    for (const task of bundle.assigned_tasks) {
      completedTaskIds.add(task.task_id);
    }
    for (const output of bundle.expected_outputs) {
      producedArtifacts.add(output);
    }
  }

  const replayedAgents = replaySteps
    .filter((step) => step.status === "replayed")
    .map((step) => step.agent_id);
  const blockedAgents = replaySteps
    .filter((step) => step.status === "blocked")
    .map((step) => step.agent_id);

  return {
    replay_order: input.coordinationPlan.final_execution_order,
    replay_steps: replaySteps,
    replay_summary: [
      `Replayed agents: ${replayedAgents.length > 0 ? replayedAgents.join(", ") : "none"}.`,
      `Blocked agents: ${blockedAgents.length > 0 ? blockedAgents.join(", ") : "none"}.`,
      blockedAgents.length === 0
        ? "Replay chain completed without missing handoff artifacts."
        : "Replay chain stopped because at least one handoff dependency was missing.",
    ],
  };
}
