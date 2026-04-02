import type {
  MultiActorOutcomeMerge,
  MultiActorSessionReceipt,
  RealExecutionPrepContract,
  ReviewEscalations,
} from "../agents/agent_types.ts";

type BuildMultiActorSessionReceiptInput = {
  mergedActorOutcomes: MultiActorOutcomeMerge;
  realExecutionPrepContract: RealExecutionPrepContract;
  reviewEscalations: ReviewEscalations;
};

export function buildMultiActorSessionReceipt(
  input: BuildMultiActorSessionReceiptInput,
): MultiActorSessionReceipt {
  const readyReviews = [...input.realExecutionPrepContract.real_execution_prep.ready_reviews];
  const blockedReviews = [...input.realExecutionPrepContract.real_execution_prep.not_ready_reviews];
  const escalatedReviews = input.reviewEscalations.escalations.map((entry) => entry.review_id);
  const receiptStatus = readyReviews.length > 0 && blockedReviews.length === 0
    ? "ready"
    : readyReviews.length > 0
      ? "partial"
      : "blocked";

  return {
    multi_actor_session_receipt: {
      session_id: input.mergedActorOutcomes.merged_actor_outcomes.session_id,
      involved_actors: input.mergedActorOutcomes.merged_actor_outcomes.involved_actors,
      ready_reviews: readyReviews,
      blocked_reviews: blockedReviews,
      escalated_reviews: escalatedReviews,
      receipt_status: receiptStatus,
    },
    receipt_summary: [
      `Involved actors: ${input.mergedActorOutcomes.merged_actor_outcomes.involved_actors.join(", ") || "none"}.`,
      `Ready reviews: ${readyReviews.join(", ") || "none"}.`,
      `Blocked reviews: ${blockedReviews.join(", ") || "none"}.`,
      `Escalated reviews: ${escalatedReviews.join(", ") || "none"}.`,
      `Receipt status: ${receiptStatus}.`,
    ],
  };
}
