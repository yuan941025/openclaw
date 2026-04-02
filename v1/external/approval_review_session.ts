import type {
  ApprovalReviewSession,
  OutboundReviewPackResult,
} from "../agents/agent_types.ts";

type BuildApprovalReviewSessionInput = {
  outboundReviewPack: OutboundReviewPackResult;
  goal_summary: string;
};

export function buildApprovalReviewSession(
  input: BuildApprovalReviewSessionInput,
): ApprovalReviewSession {
  const reviewIds = input.outboundReviewPack.review_packs.map((review) => review.review_id);
  const sourceAgentIds = [...new Set(
    input.outboundReviewPack.review_packs.map((review) => review.source_agent_id),
  )];
  const actionTypes = [...new Set(
    input.outboundReviewPack.review_packs.map((review) => review.action_type),
  )];

  return {
    review_session: {
      session_id: "approval_session_1",
      review_ids: reviewIds,
      source_agent_ids: sourceAgentIds,
      action_types: actionTypes,
      session_status: "open",
      created_from_goal: input.goal_summary,
    },
    session_summary: [
      `Approval session includes reviews: ${reviewIds.join(", ") || "none"}.`,
      `Primary action types: ${actionTypes.join(", ") || "none"}.`,
      `Participating source agents: ${sourceAgentIds.join(", ") || "none"}.`,
      "Current review-only status: open.",
    ],
  };
}
