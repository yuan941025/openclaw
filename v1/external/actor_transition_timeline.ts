import type {
  ActorOwnershipContract,
  ActorTransitionTimeline,
  ReviewEscalations,
  SessionAssignmentRoutes,
  SessionReassignment,
} from "../agents/agent_types.ts";

type BuildActorTransitionTimelineInput = {
  actorOwnershipContract: ActorOwnershipContract;
  reviewEscalations: ReviewEscalations;
  sessionReassignment: SessionReassignment;
  sessionAssignmentRoutes?: SessionAssignmentRoutes;
};

export function buildActorTransitionTimeline(
  input: BuildActorTransitionTimelineInput,
): ActorTransitionTimeline {
  const assignmentByReview = new Map(
    input.sessionAssignmentRoutes?.assignment_routes.map((entry) => [entry.review_id, entry]) ?? [],
  );
  const escalationByReview = new Map(
    input.reviewEscalations.escalations.map((entry) => [entry.review_id, entry]),
  );
  const reassignmentByReview = new Map(
    input.sessionReassignment.reassignment_result.map((entry) => [entry.review_id, entry]),
  );

  const transitionTimeline = input.actorOwnershipContract.ownership_contract.map((entry, index) => {
    const transitions = [
      `ownership:${entry.primary_actor_id}`,
      `assignment:${assignmentByReview.get(entry.review_id)?.assigned_actor_id ?? entry.primary_actor_id}`,
    ];
    const escalation = escalationByReview.get(entry.review_id);
    if (escalation) {
      transitions.push(`escalation:${escalation.from_actor_id}->${escalation.to_actor_id}`);
    }
    const reassignment = reassignmentByReview.get(entry.review_id);
    if (reassignment && reassignment.reassignment_status !== "unchanged") {
      transitions.push(`${reassignment.reassignment_status}:${reassignment.previous_actor_id ?? "none"}->${reassignment.new_actor_id}`);
    }

    return {
      timeline_id: `actor_transition_timeline_${index + 1}`,
      review_id: entry.review_id,
      transitions,
    };
  });

  return {
    transition_timeline: transitionTimeline,
    timeline_summary: transitionTimeline
      .filter((entry) => entry.transitions.length > 2)
      .map((entry) => `${entry.review_id} moved across: ${entry.transitions.join(" | ")}`)
      .concat(
        transitionTimeline.every((entry) => entry.transitions.length <= 2)
          ? ["No review required a multi-actor transition beyond basic ownership and assignment."]
          : [],
      ),
  };
}
