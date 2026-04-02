import type {
  ExecutionHandoffClosure,
  MultiActorSessionReceipt,
  PreExecutionClosureReport,
  PrepContractRevalidation,
} from "../agents/agent_types.ts";

type BuildPreExecutionClosureReportInput = {
  executionHandoffClosure: ExecutionHandoffClosure;
  multiActorSessionReceipt: MultiActorSessionReceipt;
  prepRevalidation: PrepContractRevalidation;
};

export function buildPreExecutionClosureReport(
  input: BuildPreExecutionClosureReportInput,
): PreExecutionClosureReport {
  const finalReadyReviews = [...input.executionHandoffClosure.execution_handoff_closure.handoff_ready_reviews];
  const remainingBlockers = [
    ...input.executionHandoffClosure.execution_handoff_closure.handoff_blocked_reviews,
    ...input.multiActorSessionReceipt.multi_actor_session_receipt.blocked_reviews,
    ...input.prepRevalidation.prep_revalidation.revalidated_not_ready_reviews,
  ].filter((reviewId, index, array) => array.indexOf(reviewId) === index);
  const overallStatus = finalReadyReviews.length > 0 && remainingBlockers.length === 0
    ? "ready"
    : finalReadyReviews.length > 0
      ? "partial"
      : "blocked";

  return {
    closure_report: {
      session_id: input.executionHandoffClosure.execution_handoff_closure.session_id,
      final_ready_reviews: finalReadyReviews,
      remaining_blockers: remainingBlockers,
      overall_status: overallStatus,
    },
    report_summary: [
      `Final ready reviews: ${finalReadyReviews.join(", ") || "none"}.`,
      `Remaining blockers: ${remainingBlockers.join(", ") || "none"}.`,
      `Overall status: ${overallStatus}.`,
    ],
    next_real_world_step: overallStatus === "ready"
      ? "The session can now be connected to a real outbound executor."
      : "Resolve remaining blockers before any real execution bridge.",
  };
}
