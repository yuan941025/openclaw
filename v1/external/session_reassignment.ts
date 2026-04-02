import type {
  ActorOwnershipContract,
  ReviewEscalations,
  SessionReassignment,
} from "../agents/agent_types.ts";

type RunSessionReassignmentInput = {
  escalations: ReviewEscalations;
  ownershipContract: ActorOwnershipContract;
};

export function runSessionReassignment(
  input: RunSessionReassignmentInput,
): SessionReassignment {
  const escalationByReview = new Map(
    input.escalations.escalations.map((entry) => [entry.review_id, entry]),
  );

  const reassignmentResult = input.ownershipContract.ownership_contract.map((entry) => {
    const escalation = escalationByReview.get(entry.review_id);
    if (!escalation) {
      return {
        review_id: entry.review_id,
        previous_actor_id: entry.primary_actor_id,
        new_actor_id: entry.primary_actor_id,
        reassignment_status: "unchanged" as const,
      };
    }

    return {
      review_id: entry.review_id,
      previous_actor_id: escalation.from_actor_id,
      new_actor_id: escalation.to_actor_id,
      reassignment_status: escalation.to_actor_id === "approver_1" ? "taken_over" as const : "reassigned" as const,
    };
  });

  return {
    reassignment_result: reassignmentResult,
    reassignment_summary: reassignmentResult.map((entry) =>
      `${entry.review_id}: ${entry.previous_actor_id ?? "none"} -> ${entry.new_actor_id} (${entry.reassignment_status}).`
    ),
    next_reassignment_step: reassignmentResult.some((entry) => entry.reassignment_status !== "unchanged")
      ? "Continue with the reassigned reviewers before real execution prep."
      : "No reassignment is needed before the next review step.",
  };
}
