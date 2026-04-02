import type {
  ActorReassignmentReplay,
  MultiActorSessionReceipt,
  PrepContractRevalidation,
  RealExecutionPrepContract,
} from "../agents/agent_types.ts";

type RevalidatePrepContractInput = {
  realExecutionPrepContract: RealExecutionPrepContract;
  multiActorSessionReceipt: MultiActorSessionReceipt;
  reassignmentReplay: ActorReassignmentReplay;
};

export function revalidatePrepContract(
  input: RevalidatePrepContractInput,
): PrepContractRevalidation {
  const readyReviewSet = new Set(input.multiActorSessionReceipt.multi_actor_session_receipt.ready_reviews);
  const revalidatedReadyReviews = input.realExecutionPrepContract.real_execution_prep.ready_reviews
    .filter((reviewId) => readyReviewSet.has(reviewId));
  const revalidatedNotReadyReviews = [
    ...input.realExecutionPrepContract.real_execution_prep.not_ready_reviews,
    ...input.realExecutionPrepContract.real_execution_prep.ready_reviews.filter(
      (reviewId) => !readyReviewSet.has(reviewId),
    ),
  ].filter((reviewId, index, array) => array.indexOf(reviewId) === index);

  const revalidationStatus = revalidatedReadyReviews.length > 0
    && revalidatedNotReadyReviews.length === 0
    ? "valid"
    : revalidatedReadyReviews.length > 0
      ? "partial"
      : "invalid";
  const reassignedReviews = input.reassignmentReplay.reassignment_replay.replay_steps
    .filter((entry) => entry.replay_status !== "unchanged")
    .map((entry) => entry.review_id);

  return {
    prep_revalidation: {
      session_id: input.realExecutionPrepContract.real_execution_prep.session_id,
      revalidated_ready_reviews: revalidatedReadyReviews,
      revalidated_not_ready_reviews: revalidatedNotReadyReviews,
      revalidation_status: revalidationStatus,
    },
    revalidation_summary: [
      `Revalidated ready reviews: ${revalidatedReadyReviews.join(", ") || "none"}.`,
      `Revalidated not-ready reviews: ${revalidatedNotReadyReviews.join(", ") || "none"}.`,
      `Reassigned reviews checked during revalidation: ${reassignedReviews.join(", ") || "none"}.`,
      `Revalidation status: ${revalidationStatus}.`,
    ],
    next_revalidation_step: revalidationStatus === "valid"
      ? "Prep contract remains valid after actor routing replay."
      : revalidationStatus === "partial"
        ? "Repair partially invalidated reviews before real execution handoff."
        : "Rebuild the actor/execution path before any real execution bridge.",
  };
}
