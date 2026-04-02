import type {
  HandoffConsistencyResult,
  TeamBundleValidation,
  TeamReplayReceipt,
  TeamReplayResult,
} from "./agent_types.ts";

type BuildTeamReplayReceiptInput = {
  replayResult: TeamReplayResult;
  bundleValidation: TeamBundleValidation;
  handoffConsistency: HandoffConsistencyResult;
};

function buildNextFeedbackTarget(
  input: BuildTeamReplayReceiptInput,
): string[] {
  const blockedAgents = input.replayResult.replay_steps
    .filter((step) => step.status === "blocked")
    .map((step) => step.agent_id);
  const invalidBundleAgents = input.bundleValidation.checked_agents
    .filter((agent) => agent.missing_outputs.length > 0)
    .map((agent) => agent.agent_id);
  const inconsistentHandoffAgents = input.handoffConsistency.checked_handoffs.flatMap((handoff) => {
    if (handoff.exists_in_outputs && handoff.exists_in_required_inputs) {
      return [];
    }

    return [handoff.from_agent_id, handoff.to_agent_id];
  });

  return [...new Set([...blockedAgents, ...invalidBundleAgents, ...inconsistentHandoffAgents])];
}

export function buildTeamReplayReceipt(
  input: BuildTeamReplayReceiptInput,
): TeamReplayReceipt {
  const replayedAgents = input.replayResult.replay_steps
    .filter((step) => step.status === "replayed")
    .map((step) => step.agent_id);
  const blockedAgents = input.replayResult.replay_steps
    .filter((step) => step.status === "blocked")
    .map((step) => step.agent_id);
  const replayValidationNotes = [
    `Bundle validation status: ${input.bundleValidation.bundle_validation_status}.`,
    `Handoff consistency status: ${input.handoffConsistency.handoff_status}.`,
    `Replay blocked agents: ${blockedAgents.length > 0 ? blockedAgents.join(", ") : "none"}.`,
    ...input.bundleValidation.validation_summary,
    ...input.handoffConsistency.inconsistency_notes,
  ];
  const severeValidationFailure = input.bundleValidation.bundle_validation_status === "invalid"
    || input.handoffConsistency.handoff_status === "inconsistent";
  const replayStatus = replayedAgents.length === input.replayResult.replay_steps.length
      && input.bundleValidation.bundle_validation_status === "valid"
      && input.handoffConsistency.handoff_status === "consistent"
    ? "completed"
    : severeValidationFailure && blockedAgents.length > 0
      ? "failed"
      : "partial";

  return {
    replay_status: replayStatus,
    replayed_agents: replayedAgents,
    blocked_agents: blockedAgents,
    produced_artifacts: [
      ...new Set(input.replayResult.replay_steps.flatMap((step) => step.produced_outputs)),
    ],
    replay_validation_notes: replayValidationNotes,
    next_feedback_target: buildNextFeedbackTarget(input),
  };
}
