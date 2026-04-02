import type {
  AgentFeedbackRouting,
  AgentLoopPreview,
  TeamReplayReceipt,
} from "./agent_types.ts";

type PreviewNextAgentLoopInput = {
  teamReplayReceipt: TeamReplayReceipt;
  feedbackRouting: AgentFeedbackRouting;
};

function isPrioritizedAgent(agentId: string): boolean {
  return agentId.startsWith("coder_") || agentId.startsWith("tester_");
}

function buildNextTeamGoalHint(
  prioritizedAgents: string[],
  retryAgents: string[],
  skipAgents: string[],
): string {
  if (prioritizedAgents.length > 0) {
    const leadAgent = prioritizedAgents[0];
    const downstreamAgent = retryAgents.find((agentId) => agentId !== leadAgent);
    return downstreamAgent
      ? `Retry ${leadAgent} handoff package before re-running ${downstreamAgent}.`
      : `Retry ${leadAgent} handoff package before the next team cycle.`;
  }

  if (retryAgents.length > 0) {
    return `Retry ${retryAgents.join(", ")} before the next team cycle.`;
  }

  const continuationAgent = skipAgents.at(-1) ?? "the current replay chain";
  return `Skip ${skipAgents.join(", ")} and continue from ${continuationAgent} replay validation review.`;
}

export function previewNextAgentLoop(
  input: PreviewNextAgentLoopInput,
): AgentLoopPreview {
  const nextCycleAgentsToSkip = [
    ...new Set([
      ...input.teamReplayReceipt.replayed_agents,
      ...input.feedbackRouting.skip_agents,
    ]),
  ];
  const nextCycleAgentsToRetry = [
    ...new Set([
      ...input.teamReplayReceipt.blocked_agents,
      ...input.teamReplayReceipt.next_feedback_target,
      ...input.feedbackRouting.retry_agents,
    ]),
  ];
  const nextCycleAgentsToPrioritize = [
    ...new Set([
      ...input.feedbackRouting.prioritized_agents,
      ...nextCycleAgentsToRetry.filter((agentId) => isPrioritizedAgent(agentId)),
    ]),
  ];

  return {
    next_cycle_agents_to_skip: nextCycleAgentsToSkip,
    next_cycle_agents_to_retry: nextCycleAgentsToRetry,
    next_cycle_agents_to_prioritize: nextCycleAgentsToPrioritize,
    loop_preview_summary: [
      `Skip next cycle for: ${nextCycleAgentsToSkip.length > 0 ? nextCycleAgentsToSkip.join(", ") : "none"}.`,
      `Retry next cycle for: ${nextCycleAgentsToRetry.length > 0 ? nextCycleAgentsToRetry.join(", ") : "none"}.`,
      `Prioritize next cycle for: ${nextCycleAgentsToPrioritize.length > 0 ? nextCycleAgentsToPrioritize.join(", ") : "none"}.`,
    ],
    next_team_goal_hint: buildNextTeamGoalHint(
      nextCycleAgentsToPrioritize,
      nextCycleAgentsToRetry,
      nextCycleAgentsToSkip,
    ),
  };
}
