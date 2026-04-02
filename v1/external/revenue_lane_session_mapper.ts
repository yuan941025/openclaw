import type {
  ApprovalReviewSession,
  MonetizationLanePreview,
  RevenueLaneSessionMap,
} from "../agents/agent_types.ts";

type MapRevenueLaneSessionInput = {
  monetizationLanePreview: MonetizationLanePreview;
  approvalReviewSession: ApprovalReviewSession;
};

export function mapRevenueLaneSession(
  input: MapRevenueLaneSessionInput,
): RevenueLaneSessionMap {
  const lane = input.monetizationLanePreview.monetization_lane;

  return {
    lane_session_map: {
      lane_id: lane.lane_id,
      session_id: input.approvalReviewSession.review_session.session_id,
      mapped_action_types: [...input.approvalReviewSession.review_session.action_types],
      mapped_offer_type: lane.offer_type,
      mapped_target_customer: lane.target_customer,
    },
    mapping_summary: [
      `Session ${input.approvalReviewSession.review_session.session_id} maps to lane ${lane.lane_id}.`,
      `Target customer: ${lane.target_customer}.`,
      `Offer type: ${lane.offer_type}.`,
    ],
  };
}
