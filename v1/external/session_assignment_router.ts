import type {
  ActorOwnershipContract,
  ApprovalWorkQueue,
  SessionAssignmentRoutes,
} from "../agents/agent_types.ts";
import { getApprovalQueueStatusForReview } from "./approval_work_queue.ts";

type RouteSessionAssignmentsInput = {
  ownershipContract: ActorOwnershipContract;
  approvalWorkQueue: ApprovalWorkQueue;
};

export function routeSessionAssignments(
  input: RouteSessionAssignmentsInput,
): SessionAssignmentRoutes {
  const assignmentRoutes = input.ownershipContract.ownership_contract.map((entry) => {
    const queueStatus = getApprovalQueueStatusForReview(entry.review_id, input.approvalWorkQueue.approval_queue);
    const financeLike = entry.review_id.includes("create_invoice");

    if (financeLike || queueStatus === "rejected") {
      return {
        review_id: entry.review_id,
        assigned_actor_id: entry.backup_actor_id ?? entry.primary_actor_id,
        route_status: "escalated" as const,
      };
    }

    if (!entry.primary_actor_id) {
      return {
        review_id: entry.review_id,
        assigned_actor_id: "",
        route_status: "deferred" as const,
      };
    }

    return {
      review_id: entry.review_id,
      assigned_actor_id: entry.primary_actor_id,
      route_status: "assigned" as const,
    };
  });

  return {
    assignment_routes: assignmentRoutes,
    route_summary: assignmentRoutes.map((route) =>
      `${route.review_id} -> ${route.assigned_actor_id || "unassigned"} (${route.route_status}).`
    ),
    next_assignment_step: assignmentRoutes.some((route) => route.route_status === "escalated")
      ? "Resolve escalated review routes before real execution prep."
      : "Continue with assigned review owners.",
  };
}
