import type {
  ControlledFollowupPreview,
  ConversionStagePreview,
  ReplyFeedbackBridge,
  RevenueLaneSessionMap,
  RevenueLoopPreview,
} from "../agents/agent_types.ts";

type BuildRevenueLoopPreviewInput = {
  laneSessionMap: RevenueLaneSessionMap;
  conversionStagePreview: ConversionStagePreview;
  replyFeedbackBridge: ReplyFeedbackBridge;
  followupPreview: ControlledFollowupPreview;
};

export function buildRevenueLoopPreview(
  input: BuildRevenueLoopPreviewInput,
): RevenueLoopPreview {
  const currentStage = input.conversionStagePreview.conversion_stage_preview.current_stage;
  const hasReplySignals = input.replyFeedbackBridge.reply_feedback_bridge.monetization_feedback.revenue_signals.length > 0;
  const currentCycleStatus = currentStage === "approval_gate"
    ? "awaiting_approval"
    : currentStage === "reply_wait" && hasReplySignals
      ? "followup_ready"
      : currentStage === "reply_wait"
        ? "awaiting_reply"
        : "preparing";
  const nextControlledAction = currentCycleStatus === "followup_ready"
    ? `Prepare ${input.followupPreview.followup_preview.suggested_action_type} for the next approval session.`
    : currentCycleStatus === "awaiting_reply"
      ? "Await reply signal before preparing the next outbound pack."
      : currentCycleStatus === "awaiting_approval"
        ? "Hold the lane at the approval gate until the session is cleared."
        : "Refresh the lane preparation artifacts before the next approval cycle.";

  return {
    revenue_loop_preview: {
      lane_id: input.laneSessionMap.lane_session_map.lane_id,
      session_id: input.laneSessionMap.lane_session_map.session_id,
      current_cycle_status: currentCycleStatus,
      revenue_signals: input.replyFeedbackBridge.reply_feedback_bridge.monetization_feedback.revenue_signals,
      next_controlled_action: nextControlledAction,
      loop_notes: [
        `Current conversion stage: ${currentStage}.`,
        `Revenue signals: ${input.replyFeedbackBridge.reply_feedback_bridge.monetization_feedback.revenue_signals.join(", ") || "none"}.`,
        `Next follow-up action: ${input.followupPreview.followup_preview.suggested_action_type}.`,
      ],
    },
    loop_summary: [
      `Lane ${input.laneSessionMap.lane_session_map.lane_id} is ${currentCycleStatus}.`,
      `Next controlled action: ${nextControlledAction}`,
    ],
    next_revenue_loop_step: currentCycleStatus === "followup_ready"
      ? "Request approval for follow-up message draft."
      : currentCycleStatus === "awaiting_reply"
        ? "Await reply signal before preparing the next outbound pack."
        : currentCycleStatus === "awaiting_approval"
          ? "Prepare quote revision pack for the next approval cycle."
          : "Refresh the revenue lane inputs before the next controlled loop.",
  };
}
