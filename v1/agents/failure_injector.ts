import {
  findReplayBundle,
  isReplayInputSatisfied,
} from "./team_replay_runner.ts";
import {
  getFailureScenarioProfile as getProfileFromRegistry,
  listFailureScenarioProfiles as listProfilesFromRegistry,
} from "./failure_scenario_profiles.ts";
import type {
  AgentExecutionBundleExport,
  CoordinationPlan,
  DegradedReplayResult,
  FailureScenarioProfile,
  ReplayFailureInjection,
  TeamExecutionSimulation,
} from "./agent_types.ts";

type InjectReplayFailuresInput = {
  executionBundles: AgentExecutionBundleExport;
  coordinationPlan: CoordinationPlan;
  simulationResult: TeamExecutionSimulation;
  failureConfig?: ReplayFailureInjection[];
  failureScenarioId?: string;
  failureScenarioProfile?: FailureScenarioProfile;
};

function matchesInjectionAgent(
  injection: ReplayFailureInjection,
  agentId: string,
): boolean {
  return !injection.agent_id || injection.agent_id === agentId;
}

function applyOutputFailure(
  outputs: string[],
  injection: ReplayFailureInjection,
  handoffArtifacts: string[],
): string[] {
  if (injection.type === "broken_handoff") {
    const brokenOutputs = outputs.filter((output) => !handoffArtifacts.includes(output));
    if (!injection.artifact) {
      return brokenOutputs;
    }

    return brokenOutputs.filter((output) => output !== injection.artifact);
  }

  if (!injection.artifact) {
    return [];
  }

  return outputs.filter((output) => output !== injection.artifact);
}

function buildFailureReason(
  explicitReason: string[],
  missingInputs: string[],
): string | undefined {
  const reasonParts = [
    ...explicitReason,
    ...missingInputs.map((missingInput) => `Missing required input ${missingInput}.`),
  ];

  return reasonParts.length > 0 ? reasonParts.join(" ") : undefined;
}

function resolveInjectedFailures(
  input: InjectReplayFailuresInput,
): ReplayFailureInjection[] {
  if (input.failureConfig) {
    return input.failureConfig;
  }

  if (input.failureScenarioProfile) {
    return input.failureScenarioProfile.failures;
  }

  if (input.failureScenarioId) {
    return getProfileFromRegistry(input.failureScenarioId)?.failures ?? [];
  }

  return [];
}

export function getFailureScenarioProfile(
  scenarioId: string,
): FailureScenarioProfile | undefined {
  return getProfileFromRegistry(scenarioId);
}

export function listFailureScenarioProfiles(): FailureScenarioProfile[] {
  return listProfilesFromRegistry();
}

export function injectReplayFailures(
  input: InjectReplayFailuresInput,
): DegradedReplayResult {
  const injectedFailures = resolveInjectedFailures(input);
  const completedTaskIds = new Set<string>();
  const producedArtifacts = new Set<string>();
  const degradedReplaySteps: DegradedReplayResult["degraded_replay_steps"] = [];

  for (const agentId of input.coordinationPlan.final_execution_order) {
    const bundle = findReplayBundle(input.executionBundles.bundles, agentId);
    const simulationStatus = input.simulationResult.simulated_agent_results.find((result) =>
      result.agent_id === agentId
    );
    if (!bundle) {
      continue;
    }

    const matchingFailures = injectedFailures.filter((failure) =>
      matchesInjectionAgent(failure, agentId)
    );
    const outgoingHandoffArtifacts = input.coordinationPlan.handoff_rules
      .filter((rule) => rule.from_agent_id === agentId)
      .map((rule) => rule.artifact);
    const blockedAgentFailure = matchingFailures.find((failure) => failure.type === "blocked_agent");
    const consumedInputs = bundle.required_inputs.filter((requiredInput) =>
      isReplayInputSatisfied(requiredInput, completedTaskIds, producedArtifacts)
    );
    const missingInputs = bundle.required_inputs.filter((requiredInput) =>
      !isReplayInputSatisfied(requiredInput, completedTaskIds, producedArtifacts)
    );

    if (simulationStatus?.status === "blocked" || blockedAgentFailure || missingInputs.length > 0) {
      degradedReplaySteps.push({
        step_id: `degraded_replay_step_${degradedReplaySteps.length + 1}`,
        agent_id: bundle.agent_id,
        status: "blocked",
        failure_reason: buildFailureReason(
          blockedAgentFailure ? [blockedAgentFailure.reason] : [],
          missingInputs,
        ),
      });
      continue;
    }

    let producedOutputs = [...bundle.expected_outputs];
    const failureReasons: string[] = [];
    let stepStatus: DegradedReplayResult["degraded_replay_steps"][number]["status"] = "replayed";

    for (const failure of matchingFailures) {
      if (failure.type !== "missing_output" && failure.type !== "broken_handoff") {
        continue;
      }

      producedOutputs = applyOutputFailure(producedOutputs, failure, outgoingHandoffArtifacts);
      stepStatus = "degraded";
      failureReasons.push(failure.reason);
    }

    degradedReplaySteps.push({
      step_id: `degraded_replay_step_${degradedReplaySteps.length + 1}`,
      agent_id: bundle.agent_id,
      status: stepStatus,
      failure_reason: failureReasons.length > 0 ? failureReasons.join(" ") : undefined,
    });

    for (const task of bundle.assigned_tasks) {
      completedTaskIds.add(task.task_id);
    }
    for (const output of producedOutputs) {
      producedArtifacts.add(output);
    }
    void consumedInputs;
  }

  const degradedAgents = degradedReplaySteps
    .filter((step) => step.status === "degraded")
    .map((step) => step.agent_id);
  const blockedAgents = degradedReplaySteps
    .filter((step) => step.status === "blocked")
    .map((step) => step.agent_id);

  return {
    injected_failures: injectedFailures,
    degraded_replay_order: input.coordinationPlan.final_execution_order,
    degraded_replay_steps: degradedReplaySteps,
    degraded_summary: [
      ...(injectedFailures.length > 0
        ? injectedFailures.map((failure) =>
          `Injected ${failure.type} on ${failure.agent_id ?? "unknown_agent"}${failure.artifact ? ` for ${failure.artifact}` : ""}: ${failure.reason}`
        )
        : ["No replay failures injected; degraded replay follows the normal replay path."]),
      `Degraded agents: ${degradedAgents.length > 0 ? degradedAgents.join(", ") : "none"}.`,
      `Blocked agents: ${blockedAgents.length > 0 ? blockedAgents.join(", ") : "none"}.`,
      blockedAgents.length > 0
        ? `Downstream impact reached: ${blockedAgents.join(", ")}.`
        : "No downstream replay steps were blocked by the injected failures.",
    ],
  };
}
