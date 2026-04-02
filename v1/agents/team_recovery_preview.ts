import type {
  AgentFeedbackRouting,
  DegradedReplayReceipt,
  RepairRouting,
  TeamRecoveryPreview,
} from "./agent_types.ts";

type PreviewTeamRecoveryInput = {
  degradedReplayReceipt: DegradedReplayReceipt;
  repairRouting: RepairRouting;
  feedbackRouting?: AgentFeedbackRouting;
};

function buildNextTeamGoalHint(
  prioritizeAgents: string[],
  retryAgents: string[],
  isolateAgents: string[],
  skipAgents: string[],
): string {
  const leadAgent = prioritizeAgents[0] ?? retryAgents[0];
  const dependentAgent = isolateAgents[0] ?? retryAgents.find((agentId) => agentId !== leadAgent);

  if (leadAgent) {
    if (leadAgent.startsWith("researcher_")) {
      return `Restore ${leadAgent} artifact contract before re-running ${dependentAgent ?? "the downstream build agent"}.`;
    }

    return `Repair ${leadAgent} outputs before replaying ${dependentAgent ?? "the next downstream agent"} validation.`;
  }

  const lastStableAgent = skipAgents.at(-1) ?? "the stable replay path";
  return `Skip ${skipAgents.join(", ")} and continue from ${lastStableAgent} replay validation review.`;
}

export function previewTeamRecovery(
  input: PreviewTeamRecoveryInput,
): TeamRecoveryPreview {
  const agentsToRetry = input.repairRouting.retry_agents;
  const agentsToPrioritize = input.repairRouting.prioritize_agents;
  const agentsToSkip = (input.feedbackRouting?.skip_agents ?? []).filter((agentId) =>
    !agentsToRetry.includes(agentId)
    && !input.repairRouting.isolate_agents.includes(agentId)
  );
  const recoveryOrder = [
    ...new Set([
      ...agentsToPrioritize,
      ...agentsToRetry,
      ...input.repairRouting.isolate_agents,
      ...agentsToSkip,
    ]),
  ];

  return {
    recovery_order: recoveryOrder,
    agents_to_retry: agentsToRetry,
    agents_to_skip: agentsToSkip,
    agents_to_prioritize: agentsToPrioritize,
    recovery_summary: [
      `Recovery order: ${recoveryOrder.length > 0 ? recoveryOrder.join(" -> ") : "none"}.`,
      `Agents waiting for upstream repair: ${
        input.repairRouting.isolate_agents.length > 0
          ? input.repairRouting.isolate_agents.join(", ")
          : "none"
      }.`,
      `Replay repair targets: ${
        input.degradedReplayReceipt.next_repair_targets.length > 0
          ? input.degradedReplayReceipt.next_repair_targets.join(", ")
          : "none"
      }.`,
    ],
    next_team_goal_hint: buildNextTeamGoalHint(
      agentsToPrioritize,
      agentsToRetry,
      input.repairRouting.isolate_agents,
      agentsToSkip,
    ),
  };
}
