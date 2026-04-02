import type {
  ActorReadinessSnapshot,
  ApprovalQueuePartition,
  RealExecutionPrepContract,
} from "../agents/agent_types.ts";

type BuildActorReadinessSnapshotInput = {
  realExecutionPrepContract: RealExecutionPrepContract;
  approvalQueuePartition: ApprovalQueuePartition;
};

export function buildActorReadinessSnapshot(
  input: BuildActorReadinessSnapshotInput,
): ActorReadinessSnapshot {
  const readyReviewSet = new Set(input.realExecutionPrepContract.real_execution_prep.ready_reviews);
  const readinessSnapshot = input.approvalQueuePartition.queue_partitions.map((entry) => {
    const reviewsInScope = [
      ...entry.pending_reviews,
      ...entry.escalated_reviews,
      ...entry.final_reviews,
    ];
    const readyReviews = reviewsInScope.filter((reviewId) => readyReviewSet.has(reviewId));
    const blockedReviews = reviewsInScope.filter((reviewId) => !readyReviewSet.has(reviewId));
    const readinessStatus = readyReviews.length > 0 && blockedReviews.length === 0
      ? "ready"
      : readyReviews.length > 0
        ? "partial"
        : "blocked";

    return {
      actor_id: entry.actor_id,
      ready_reviews: readyReviews,
      blocked_reviews: blockedReviews,
      readiness_status: readinessStatus,
    };
  });

  return {
    readiness_snapshot: readinessSnapshot,
    readiness_summary: readinessSnapshot.map((entry) =>
      `${entry.actor_id} readiness=${entry.readiness_status}; ready=${entry.ready_reviews.join(", ") || "none"}; blocked=${entry.blocked_reviews.join(", ") || "none"}.`
    ),
  };
}
