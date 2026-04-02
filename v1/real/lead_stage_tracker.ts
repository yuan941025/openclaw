import type {
  LeadStageResult,
  RealExecutorReceipt,
  RealFollowupResult,
  TelegramReplyIntake,
} from "../agents/agent_types.ts";

type UpdateLeadStageInput = {
  previousStage: string;
  realExecutorReceipt?: RealExecutorReceipt | null;
  telegramReplyIntake?: TelegramReplyIntake | null;
  realFollowupResult?: RealFollowupResult | null;
};

export function updateLeadStage(
  input: UpdateLeadStageInput,
): LeadStageResult {
  const previousStage = input.previousStage;
  const replyType = input.telegramReplyIntake?.telegram_reply_intake.reply_type;
  const followupStatus = input.realFollowupResult?.followup_result.followup_status;
  const followupActionType = input.realFollowupResult?.followup_result.followup_action_type;
  const sendStatus = input.realExecutorReceipt?.real_receipt.execution_status;

  let currentStage = previousStage;
  let transitionReason = "No stage change was applied.";

  if (replyType === "rejection") {
    currentStage = "lost";
    transitionReason = "A rejection reply was received, so the lead moved to lost.";
  } else if (followupStatus === "ready_for_approval" && followupActionType === "prepare_quote") {
    currentStage = "quote_ready";
    transitionReason = "A quote request was received and the quote follow-up pack is ready for approval.";
  } else if (followupStatus === "ready_for_approval") {
    currentStage = "followup_ready";
    transitionReason = "A reply arrived and the next follow-up pack is ready for approval.";
  } else if (replyType) {
    currentStage = "reply_received";
    transitionReason = "A real reply arrived and is now recorded on the lead.";
  } else if (sendStatus === "sent") {
    currentStage = "message_sent";
    transitionReason = "The first approved outbound message was sent successfully.";
  }

  return {
    lead_stage_result: {
      previous_stage: previousStage,
      current_stage: currentStage,
      transition_reason: transitionReason,
    },
    lead_stage_summary: [
      `Previous stage: ${previousStage}.`,
      `Current stage: ${currentStage}.`,
      transitionReason,
    ],
  };
}
