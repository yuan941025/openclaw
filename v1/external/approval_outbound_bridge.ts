import type {
  ApprovalOutboundBridge,
  ControlledOutboundSimulation,
  SessionReceipt,
} from "../agents/agent_types.ts";

type BuildApprovalOutboundBridgeInput = {
  sessionReceipt: SessionReceipt;
  controlledOutboundSimulation: ControlledOutboundSimulation;
};

export function buildApprovalOutboundBridge(
  input: BuildApprovalOutboundBridgeInput,
): ApprovalOutboundBridge {
  const approvedReviewSet = new Set(input.sessionReceipt.session_receipt.approved_reviews);
  const reviseReviewSet = new Set(input.sessionReceipt.session_receipt.revise_required_reviews);
  const rejectedReviewSet = new Set(input.sessionReceipt.session_receipt.rejected_reviews);
  const executableReviews = input.controlledOutboundSimulation.simulated_actions
    .filter((action) =>
      approvedReviewSet.has(action.review_id) && action.simulation_status === "executed"
    )
    .map((action) => action.review_id);
  const blockedReviews = input.controlledOutboundSimulation.simulated_actions
    .filter((action) =>
      rejectedReviewSet.has(action.review_id) || action.simulation_status === "blocked"
    )
    .map((action) => action.review_id);
  const pendingReviews = input.controlledOutboundSimulation.simulated_actions
    .filter((action) =>
      reviseReviewSet.has(action.review_id) || action.simulation_status === "revision_requested"
    )
    .map((action) => action.review_id);

  const bridgeStatus = executableReviews.length > 0 && blockedReviews.length === 0 && pendingReviews.length === 0
    ? "ready"
    : pendingReviews.length > 0 || executableReviews.length > 0
      ? "partial"
      : "blocked";

  return {
    outbound_bridge: {
      session_id: input.sessionReceipt.session_receipt.session_id,
      executable_reviews: [...new Set(executableReviews)],
      blocked_reviews: [...new Set(blockedReviews)],
      pending_reviews: [...new Set(pendingReviews)],
      bridge_status: bridgeStatus,
    },
    bridge_summary: [
      `Executable reviews: ${[...new Set(executableReviews)].join(", ") || "none"}.`,
      `Blocked reviews: ${[...new Set(blockedReviews)].join(", ") || "none"}.`,
      `Pending reviews: ${[...new Set(pendingReviews)].join(", ") || "none"}.`,
    ],
    next_executor_step: bridgeStatus === "ready"
      ? "Prepare the approved review set for the next outbound executor handoff."
      : bridgeStatus === "partial"
        ? "Resolve pending review revisions before the next outbound executor handoff."
        : "Keep the outbound bridge blocked until rejected or blocked reviews are repaired.",
  };
}
