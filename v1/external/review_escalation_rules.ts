import type {
  BatchApprovalStateMachineResult,
  ReviewEscalations,
  SessionAssignmentRoutes,
  SessionReceipt,
} from "../agents/agent_types.ts";

type BuildReviewEscalationsInput = {
  assignmentRoutes: SessionAssignmentRoutes;
  batchStateMachineResult?: BatchApprovalStateMachineResult;
  sessionReceipt?: SessionReceipt;
};

export function buildReviewEscalations(
  input: BuildReviewEscalationsInput,
): ReviewEscalations {
  const escalations = input.assignmentRoutes.assignment_routes.flatMap((route) => {
    const rejectedInSession = input.sessionReceipt?.session_receipt.rejected_reviews.includes(route.review_id) ?? false;
    const reviseInBatch = input.batchStateMachineResult?.batch_state_machine_result.revise_required_reviews.includes(route.review_id)
      ?? false;

    if (route.review_id.includes("create_invoice")) {
      return [{
        review_id: route.review_id,
        from_actor_id: route.assigned_actor_id || "senior_reviewer_1",
        to_actor_id: "approver_1",
        escalation_reason: "Finance-like review requires final approver oversight.",
      }];
    }

    if (route.route_status === "escalated" || rejectedInSession) {
      return [{
        review_id: route.review_id,
        from_actor_id: route.assigned_actor_id || "reviewer_1",
        to_actor_id: "senior_reviewer_1",
        escalation_reason: "Rejected or explicitly escalated review must move to senior_reviewer_1.",
      }];
    }

    if (reviseInBatch) {
      return [{
        review_id: route.review_id,
        from_actor_id: route.assigned_actor_id || "reviewer_1",
        to_actor_id: "senior_reviewer_1",
        escalation_reason: "Revise-required review stays in elevated oversight until the next round clears.",
      }];
    }

    return [];
  });

  return {
    escalations,
    escalation_summary: escalations.length > 0
      ? escalations.map((entry) =>
        `${entry.review_id} escalated from ${entry.from_actor_id} to ${entry.to_actor_id}: ${entry.escalation_reason}`
      )
      : ["No review escalations were required."],
  };
}
