import type {
  ExecutionHandoffClosure,
  PrepContractRevalidation,
  RealExecutionPrepContract,
} from "../agents/agent_types.ts";

type BuildExecutionHandoffClosureInput = {
  prepRevalidation: PrepContractRevalidation;
  realExecutionPrepContract: RealExecutionPrepContract;
};

export function buildExecutionHandoffClosure(
  input: BuildExecutionHandoffClosureInput,
): ExecutionHandoffClosure {
  const handoffReadyReviews = [...input.prepRevalidation.prep_revalidation.revalidated_ready_reviews];
  const handoffBlockedReviews = [
    ...input.prepRevalidation.prep_revalidation.revalidated_not_ready_reviews,
    ...input.realExecutionPrepContract.real_execution_prep.not_ready_reviews,
  ].filter((reviewId, index, array) => array.indexOf(reviewId) === index);
  const closureStatus = handoffReadyReviews.length > 0 && handoffBlockedReviews.length === 0
    ? "closed_ready"
    : handoffReadyReviews.length > 0
      ? "partial"
      : "blocked";

  return {
    execution_handoff_closure: {
      session_id: input.prepRevalidation.prep_revalidation.session_id,
      handoff_ready_reviews: handoffReadyReviews,
      handoff_blocked_reviews: handoffBlockedReviews,
      closure_status: closureStatus,
      closure_requirements: [
        "actor path finalized",
        "escalation resolved",
        "prep validated",
      ],
    },
    closure_summary: [
      `Handoff-ready reviews: ${handoffReadyReviews.join(", ") || "none"}.`,
      `Handoff-blocked reviews: ${handoffBlockedReviews.join(", ") || "none"}.`,
      `Closure status: ${closureStatus}.`,
    ],
    next_handoff_step: closureStatus === "closed_ready"
      ? "Connect the closed-ready reviews to the first real executor bridge in controlled mode."
      : closureStatus === "partial"
        ? "Resolve blocked reviews before the first real executor handoff."
        : "Keep the handoff in safe mode until the prep contract is revalidated.",
  };
}
