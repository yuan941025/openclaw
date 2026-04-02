import type {
  ApprovalActorRegistry,
  ApprovalQueuePartition,
  ApprovalWorkQueue,
  ReviewEscalations,
  SessionAssignmentRoutes,
} from "../agents/agent_types.ts";
import { getApprovalQueueStatusForReview } from "./approval_work_queue.ts";

type PartitionApprovalQueueInput = {
  approvalWorkQueue: ApprovalWorkQueue;
  actorRegistry: ApprovalActorRegistry;
  assignmentRoutes: SessionAssignmentRoutes;
  escalations?: ReviewEscalations;
};

export function partitionApprovalQueue(
  input: PartitionApprovalQueueInput,
): ApprovalQueuePartition {
  const escalationMap = new Map(
    input.escalations?.escalations.map((entry) => [entry.review_id, entry.to_actor_id]) ?? [],
  );
  const queuePartitions = input.actorRegistry.actor_registry.map((actor) => ({
    actor_id: actor.actor_id,
    pending_reviews: [] as string[],
    escalated_reviews: [] as string[],
    final_reviews: [] as string[],
  }));
  const partitionByActor = new Map(queuePartitions.map((entry) => [entry.actor_id, entry]));

  for (const route of input.assignmentRoutes.assignment_routes) {
    const queueStatus = getApprovalQueueStatusForReview(route.review_id, input.approvalWorkQueue.approval_queue);
    const escalatedActorId = escalationMap.get(route.review_id);
    const targetActor = escalatedActorId ?? route.assigned_actor_id;
    const partition = partitionByActor.get(targetActor);
    if (!partition) {
      continue;
    }

    if (escalatedActorId) {
      partition.escalated_reviews.push(route.review_id);
      continue;
    }

    if (queueStatus === "approved" && route.review_id.includes("create_invoice")) {
      const finalPartition = partitionByActor.get("approver_1");
      finalPartition?.final_reviews.push(route.review_id);
      continue;
    }

    if (queueStatus === "approved") {
      partition.final_reviews.push(route.review_id);
      continue;
    }

    if (queueStatus === "pending" || queueStatus === "revise_required" || queueStatus === "rejected") {
      partition.pending_reviews.push(route.review_id);
    }
  }

  return {
    queue_partitions: queuePartitions,
    partition_summary: queuePartitions.map((entry) =>
      `${entry.actor_id}: pending=${entry.pending_reviews.join(", ") || "none"}, escalated=${entry.escalated_reviews.join(", ") || "none"}, final=${entry.final_reviews.join(", ") || "none"}.`
    ),
    next_queue_partition_step: "Review actor partitions before the next approval routing step.",
  };
}
