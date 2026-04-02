import { getTypicalProducedArtifacts } from "./agent_result_types.ts";
import type {
  AgentExecutionBundleExport,
  AgentExecutionResult,
  CoordinationPlan,
  TeamExecutionSimulation,
} from "./agent_types.ts";

type SimulateTeamExecutionInput = {
  executionBundles: AgentExecutionBundleExport;
  coordinationPlan: CoordinationPlan;
};

function findBundleByAgentId(
  bundles: AgentExecutionBundleExport["bundles"],
  agentId: string,
) {
  return bundles.find((bundle) => bundle.agent_id === agentId);
}

function buildCompletedResult(
  bundle: AgentExecutionBundleExport["bundles"][number],
  coordinationPlan: CoordinationPlan,
): AgentExecutionResult {
  const nextHandoff = coordinationPlan.handoff_rules
    .filter((rule) => rule.from_agent_id === bundle.agent_id)
    .map((rule) => ({
      to_agent_id: rule.to_agent_id,
      artifact: rule.artifact,
    }));
  const outgoingArtifacts = nextHandoff.map((handoff) => handoff.artifact);

  return {
    agent_id: bundle.agent_id,
    role: bundle.role,
    status: "completed",
    output_summary: bundle.assigned_tasks.map((task) => `${task.task_id}: ${task.title}`),
    produced_artifacts: [
      ...new Set([...getTypicalProducedArtifacts(bundle.role), ...outgoingArtifacts]),
    ],
    blockers: [],
    next_handoff: nextHandoff.length > 0 ? nextHandoff : undefined,
  };
}

function buildBlockedResult(
  bundle: AgentExecutionBundleExport["bundles"][number],
  missingInputs: string[],
): AgentExecutionResult {
  return {
    agent_id: bundle.agent_id,
    role: bundle.role,
    status: "blocked",
    output_summary: [],
    produced_artifacts: [],
    blockers: missingInputs.map((missingInput) => `Missing required input ${missingInput}.`),
  };
}

export function simulateTeamExecution(
  input: SimulateTeamExecutionInput,
): TeamExecutionSimulation {
  const completedTaskIds = new Set<string>();
  const producedArtifacts = new Set<string>();
  const simulatedAgentResults: AgentExecutionResult[] = [];

  for (const agentId of input.coordinationPlan.final_execution_order) {
    const bundle = findBundleByAgentId(input.executionBundles.bundles, agentId);
    if (!bundle) {
      continue;
    }

    const missingInputs = bundle.required_inputs.filter((requiredInput) => {
      if (requiredInput === "goal_summary") {
        return false;
      }

      if (requiredInput.startsWith("dependency:")) {
        return !completedTaskIds.has(requiredInput.slice("dependency:".length));
      }

      if (requiredInput.startsWith("artifact:")) {
        return !producedArtifacts.has(requiredInput.slice("artifact:".length));
      }

      return false;
    });

    if (missingInputs.length > 0) {
      simulatedAgentResults.push(buildBlockedResult(bundle, missingInputs));
      continue;
    }

    const result = buildCompletedResult(bundle, input.coordinationPlan);
    simulatedAgentResults.push(result);

    for (const task of bundle.assigned_tasks) {
      completedTaskIds.add(task.task_id);
    }
    for (const artifact of result.produced_artifacts) {
      producedArtifacts.add(artifact);
    }
  }

  const completedAgents = simulatedAgentResults
    .filter((result) => result.status === "completed")
    .map((result) => result.agent_id);
  const blockedAgents = simulatedAgentResults
    .filter((result) => result.status === "blocked")
    .map((result) => result.agent_id);

  return {
    execution_order: input.coordinationPlan.final_execution_order,
    simulated_agent_results: simulatedAgentResults,
    simulation_summary: [
      `Completed agents: ${completedAgents.length > 0 ? completedAgents.join(", ") : "none"}.`,
      `Blocked agents: ${blockedAgents.length > 0 ? blockedAgents.join(", ") : "none"}.`,
      blockedAgents.length === 0
        ? "The handoff chain ran through the simulated execution order."
        : "The handoff chain stopped because at least one agent was blocked.",
    ],
  };
}
