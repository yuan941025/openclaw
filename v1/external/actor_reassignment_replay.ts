import type {
  ActorOwnershipContract,
  ActorReassignmentReplay,
  SessionReassignment,
} from "../agents/agent_types.ts";

type ReplayActorReassignmentsInput = {
  sessionReassignment: SessionReassignment;
  actorOwnershipContract: ActorOwnershipContract;
  sessionId?: string;
};

export function replayActorReassignments(
  input: ReplayActorReassignmentsInput,
): ActorReassignmentReplay {
  const reassignmentByReview = new Map(
    input.sessionReassignment.reassignment_result.map((entry) => [entry.review_id, entry]),
  );
  const replaySteps = input.actorOwnershipContract.ownership_contract.map((entry) => {
    const reassignment = reassignmentByReview.get(entry.review_id);
    return {
      review_id: entry.review_id,
      previous_actor_id: reassignment?.previous_actor_id ?? entry.primary_actor_id,
      new_actor_id: reassignment?.new_actor_id ?? entry.primary_actor_id,
      replay_status: reassignment?.reassignment_status ?? "unchanged",
    };
  });

  const reassignedReviews = replaySteps
    .filter((entry) => entry.replay_status === "reassigned")
    .map((entry) => entry.review_id);
  const takenOverReviews = replaySteps
    .filter((entry) => entry.replay_status === "taken_over")
    .map((entry) => entry.review_id);

  return {
    reassignment_replay: {
      session_id: input.sessionId ?? "approval_session_1",
      replay_steps: replaySteps,
      replay_summary: [
        `Reassigned reviews: ${reassignedReviews.join(", ") || "none"}.`,
        `Approver takeovers: ${takenOverReviews.join(", ") || "none"}.`,
        `Unchanged reviews: ${replaySteps.filter((entry) => entry.replay_status === "unchanged").map((entry) => entry.review_id).join(", ") || "none"}.`,
      ],
    },
  };
}
