import type {
  LeadStageResult,
  RealExecutorReceipt,
  RealFollowupResult,
  RealOrderFlowResult,
  TelegramReplyIntake,
} from "../agents/agent_types.ts";

type RunRealOrderFlowInput = {
  sessionId: string;
  outboundReviewId: string;
  realExecutorReceipt: RealExecutorReceipt;
  telegramReplyIntake?: TelegramReplyIntake | null;
  realFollowupResult?: RealFollowupResult | null;
  leadStageResult: LeadStageResult;
};

export function runRealOrderFlow(
  input: RunRealOrderFlowInput,
): RealOrderFlowResult {
  const currentStage = input.leadStageResult.lead_stage_result.current_stage;
  const flowStatus = currentStage === "message_sent"
    ? "outbound_sent"
    : currentStage === "reply_received"
      ? "reply_received"
      : currentStage === "followup_ready"
        ? "followup_ready"
        : currentStage === "quote_ready"
          ? "quote_ready"
          : currentStage === "lost"
            ? "lost"
            : "blocked";
  const nextOrderStep = flowStatus === "quote_ready"
    ? "Request approval for the quote reply pack."
    : flowStatus === "followup_ready"
      ? "Prepare the next follow-up message for approval."
      : flowStatus === "reply_received"
        ? "Review the inbound reply and choose the next approval path."
        : flowStatus === "outbound_sent"
          ? "Wait for a reply before preparing the next outbound step."
          : flowStatus === "lost"
            ? "Stop outreach for this lead."
            : "Keep the lead in safe mode until execution blockers are cleared.";

  return {
    order_flow_result: {
      session_id: input.sessionId,
      outbound_review_id: input.outboundReviewId,
      real_receipt_id: input.realExecutorReceipt.real_receipt.receipt_id,
      reply_id: input.telegramReplyIntake?.telegram_reply_intake.reply_id,
      lead_stage: currentStage,
      flow_status: flowStatus,
    },
    flow_summary: [
      `Outbound review: ${input.outboundReviewId}.`,
      `Lead stage: ${currentStage}.`,
      `Flow status: ${flowStatus}.`,
      `Reply id: ${input.telegramReplyIntake?.telegram_reply_intake.reply_id ?? "none"}.`,
      `Follow-up status: ${input.realFollowupResult?.followup_result.followup_status ?? "none"}.`,
    ],
    next_order_step: nextOrderStep,
  };
}
