import type {
  ActorOwnershipContract,
  ApprovalActorRegistry,
  ApprovalReviewSession,
} from "../agents/agent_types.ts";

type BuildActorOwnershipContractInput = {
  approvalReviewSession: ApprovalReviewSession;
  actorRegistry: ApprovalActorRegistry;
};

function resolveOwnership(reviewId: string) {
  if (reviewId.includes("create_invoice")) {
    return {
      primary_actor_id: "senior_reviewer_1",
      backup_actor_id: "approver_1",
      ownership_reason: "Invoice-like review requires elevated ownership before any execution prep.",
    };
  }

  if (reviewId.includes("send_message") || reviewId.includes("publish_post")) {
    return {
      primary_actor_id: "operator_reviewer_1",
      backup_actor_id: "reviewer_1",
      ownership_reason: "Operator-originated outbound draft should stay with operator_reviewer_1 by default.",
    };
  }

  return {
    primary_actor_id: "reviewer_1",
    backup_actor_id: "senior_reviewer_1",
    ownership_reason: "General review defaults to reviewer_1 with elevated backup coverage.",
  };
}

export function buildActorOwnershipContract(
  input: BuildActorOwnershipContractInput,
): ActorOwnershipContract {
  const knownActors = new Set(input.actorRegistry.actor_registry.map((actor) => actor.actor_id));
  const ownershipContract = input.approvalReviewSession.review_session.review_ids.map((reviewId) => {
    const resolved = resolveOwnership(reviewId);
    return {
      review_id: reviewId,
      primary_actor_id: knownActors.has(resolved.primary_actor_id) ? resolved.primary_actor_id : "reviewer_1",
      backup_actor_id: resolved.backup_actor_id,
      ownership_reason: resolved.ownership_reason,
    };
  });

  return {
    ownership_contract: ownershipContract,
    ownership_summary: ownershipContract.map((entry) =>
      `${entry.review_id} -> ${entry.primary_actor_id}${entry.backup_actor_id ? ` (backup ${entry.backup_actor_id})` : ""}.`
    ),
  };
}
