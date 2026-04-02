import type {
  ApprovalReviewSession,
  ApprovalStateMachineResult,
  DecisionReplay,
  ReviewOverrideUpdate,
  SessionReceipt,
} from "../agents/agent_types.ts";
import { applyReviewOverrideToDecisionReplay } from "./review_override_updater.ts";

type RunApprovalStateMachineInput = {
  approvalReviewSession: ApprovalReviewSession;
  decisionReplay?: DecisionReplay;
  overrideUpdate?: ReviewOverrideUpdate;
  decisionPayload?: import("../agents/agent_types.ts").HumanDecisionPayload;
  sessionReceipt?: SessionReceipt;
};

function getCurrentStatus(
  decisionReplay: DecisionReplay | undefined,
  sessionReviewIds: string[],
): ApprovalStateMachineResult["state_machine_result"]["current_status"] {
  if (!decisionReplay || decisionReplay.decision_history.length === 0) {
    return "open";
  }

  const latestByReview = new Map<string, DecisionReplay["decision_history"][number]>();
  for (const reviewId of sessionReviewIds) {
    const latestEntry = [...decisionReplay.decision_history]
      .filter((entry) => entry.review_id === reviewId)
      .sort((left, right) => right.revision_round - left.revision_round)[0];
    if (latestEntry) {
      latestByReview.set(reviewId, latestEntry);
    }
  }

  if (latestByReview.size === 0) {
    return "open";
  }

  const decisions = [...latestByReview.values()].map((entry) => entry.decision);
  if (decisions.every((decision) => decision === "approved")) {
    return "approved";
  }
  if (decisions.every((decision) => decision === "rejected")) {
    return "rejected";
  }
  if (decisions.some((decision) => decision === "revise_required")) {
    return "revise_required";
  }
  if (decisions.includes("approved") && decisions.includes("rejected")) {
    return "mixed";
  }
  return "mixed";
}

export function runApprovalStateMachine(
  input: RunApprovalStateMachineInput,
): ApprovalStateMachineResult {
  const effectiveReplay = input.decisionReplay && input.overrideUpdate && input.decisionPayload
    ? applyReviewOverrideToDecisionReplay(input.decisionReplay, input.decisionPayload)
    : input.decisionReplay;
  const currentStatus = getCurrentStatus(
    effectiveReplay,
    input.approvalReviewSession.review_session.review_ids,
  );
  const previousStatus = input.sessionReceipt?.session_receipt.final_session_status
    ?? input.approvalReviewSession.review_session.session_status;

  return {
    state_machine_result: {
      session_id: input.approvalReviewSession.review_session.session_id,
      previous_status: previousStatus,
      current_status: currentStatus,
      transition_reason: `Session moved to ${currentStatus} after applying the latest human decision state.`,
    },
    state_summary: [
      `Previous status: ${previousStatus}.`,
      `Current status: ${currentStatus}.`,
      `Session reviews in scope: ${input.approvalReviewSession.review_session.review_ids.join(", ") || "none"}.`,
    ],
  };
}
