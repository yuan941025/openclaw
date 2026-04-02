import type {
  BatchApprovalStateMachineResult,
  ControlledFollowupPreview,
  FollowupDecisionBridge,
} from "../agents/agent_types.ts";

type BridgeFollowupDecisionsInput = {
  batchStateMachineResult: BatchApprovalStateMachineResult;
  controlledFollowupPreview?: ControlledFollowupPreview;
};

function decorateFollowups(reviewIds: string[], preview?: ControlledFollowupPreview): string[] {
  if (!preview) {
    return reviewIds;
  }

  return reviewIds.map((reviewId) => `${reviewId}:${preview.followup_preview.suggested_action_type}`);
}

export function bridgeFollowupDecisions(
  input: BridgeFollowupDecisionsInput,
): FollowupDecisionBridge {
  const allowedFollowups = decorateFollowups(
    input.batchStateMachineResult.batch_state_machine_result.approved_reviews,
    input.controlledFollowupPreview,
  );
  const blockedFollowups = decorateFollowups(
    input.batchStateMachineResult.batch_state_machine_result.rejected_reviews,
    input.controlledFollowupPreview,
  );
  const pendingFollowups = decorateFollowups(
    input.batchStateMachineResult.batch_state_machine_result.revise_required_reviews,
    input.controlledFollowupPreview,
  );

  let nextFollowupDecisionStep = "Continue follow-up review routing for pending items.";
  if (pendingFollowups.length > 0) {
    nextFollowupDecisionStep = "Resolve pending follow-up revisions before advancing the next pack.";
  } else if (allowedFollowups.length > 0) {
    nextFollowupDecisionStep = "Advance allowed follow-ups into the next controlled follow-up step.";
  } else if (blockedFollowups.length > 0) {
    nextFollowupDecisionStep = "Keep blocked follow-ups in safe mode and continue with approved alternatives.";
  }

  return {
    followup_decision_bridge: {
      allowed_followups: allowedFollowups,
      blocked_followups: blockedFollowups,
      pending_followups: pendingFollowups,
    },
    followup_bridge_summary: [
      `Allowed follow-ups: ${allowedFollowups.join(", ") || "none"}.`,
      `Pending follow-ups: ${pendingFollowups.join(", ") || "none"}.`,
      `Blocked follow-ups: ${blockedFollowups.join(", ") || "none"}.`,
    ],
    next_followup_decision_step: nextFollowupDecisionStep,
  };
}
