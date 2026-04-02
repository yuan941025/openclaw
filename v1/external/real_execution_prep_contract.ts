import type {
  ApprovalGateContract,
  ApprovalOutboundBridge,
  MultiActorOutcomeMerge,
  RealExecutionPrepContract,
} from "../agents/agent_types.ts";

type BuildRealExecutionPrepContractInput = {
  mergedActorOutcomes: MultiActorOutcomeMerge;
  approvalOutboundBridge: ApprovalOutboundBridge;
  approvalGateContract: ApprovalGateContract;
};

export function buildRealExecutionPrepContract(
  input: BuildRealExecutionPrepContractInput,
): RealExecutionPrepContract {
  const executableReviews = new Set(input.approvalOutboundBridge.outbound_bridge.executable_reviews);
  const readyReviews = input.mergedActorOutcomes.merged_actor_outcomes.approved_reviews
    .filter((reviewId) => executableReviews.has(reviewId));
  const notReadyReviews = [
    ...input.mergedActorOutcomes.merged_actor_outcomes.rejected_reviews,
    ...input.mergedActorOutcomes.merged_actor_outcomes.revise_required_reviews,
    ...input.approvalOutboundBridge.outbound_bridge.blocked_reviews,
    ...input.approvalOutboundBridge.outbound_bridge.pending_reviews,
  ].filter((reviewId, index, array) => array.indexOf(reviewId) === index);
  const prepStatus = readyReviews.length > 0 && notReadyReviews.length === 0
    ? "ready"
    : readyReviews.length > 0
      ? "partial"
      : "blocked";

  return {
    real_execution_prep: {
      session_id: input.mergedActorOutcomes.merged_actor_outcomes.session_id,
      ready_reviews: readyReviews,
      not_ready_reviews: notReadyReviews,
      prep_status: prepStatus,
      readiness_requirements: [
        "actor-approved",
        "boundary-cleared",
        "review-pack-complete",
      ],
    },
    prep_summary: [
      `Ready reviews: ${readyReviews.join(", ") || "none"}.`,
      `Not-ready reviews: ${notReadyReviews.join(", ") || "none"}.`,
      `Prep status: ${prepStatus}.`,
      `Approval-required actions in scope: ${input.approvalGateContract.approval_gate.approval_required_actions.map((entry) => entry.action_type).join(", ")}.`,
    ],
    next_real_execution_step: prepStatus === "ready"
      ? "Hand the ready session into the first real outbound executor bridge."
      : prepStatus === "partial"
        ? "Resolve not-ready reviews before enabling real execution."
        : "Keep the session in safe mode and repair the approval chain first.",
  };
}
