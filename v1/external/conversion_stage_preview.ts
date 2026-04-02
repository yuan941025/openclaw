import type {
  ApprovalOutboundBridge,
  ConversionStagePreview,
  OutboundReceipt,
  RevenueLaneSessionMap,
  SessionReceipt,
} from "../agents/agent_types.ts";

type BuildConversionStagePreviewInput = {
  sessionReceipt: SessionReceipt;
  laneSessionMap: RevenueLaneSessionMap;
  approvalOutboundBridge?: ApprovalOutboundBridge;
  outboundReceipt?: OutboundReceipt;
};

export function buildConversionStagePreview(
  input: BuildConversionStagePreviewInput,
): ConversionStagePreview {
  const isQuoteLane = input.laneSessionMap.lane_session_map.mapped_offer_type === "AI quote service";
  const bridgeStatus = input.approvalOutboundBridge?.outbound_bridge.bridge_status;
  const hasExecutedOutbound = input.outboundReceipt?.outbound_status === "completed"
    && (input.approvalOutboundBridge?.outbound_bridge.executable_reviews.length ?? 0) > 0;
  const currentStage = hasExecutedOutbound
    ? "reply_wait"
    : bridgeStatus === "ready"
      ? "outbound_ready"
      : "approval_gate";
  const completedStages = [
    "lead_preparation",
    ...(isQuoteLane ? ["quote_preparation"] : []),
    ...(currentStage !== "approval_gate" ? ["approval_gate"] : []),
    ...(currentStage === "reply_wait" ? ["outbound_ready"] : []),
  ];

  return {
    conversion_stage_preview: {
      current_stage: currentStage,
      completed_stages: completedStages,
      next_stage: currentStage === "approval_gate"
        ? "outbound_ready"
        : currentStage === "outbound_ready"
          ? "reply_wait"
          : "followup_preparation",
      stage_notes: [
        `Lane offer type: ${input.laneSessionMap.lane_session_map.mapped_offer_type}.`,
        `Session status: ${input.sessionReceipt.session_receipt.final_session_status}.`,
        `Bridge status: ${bridgeStatus ?? "not available"}.`,
      ],
    },
  };
}
