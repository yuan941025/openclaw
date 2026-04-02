import type {
  ControlledFollowupPreview,
  RealFollowupResult,
  ReplyFeedbackBridge,
  TelegramReplyIntake,
} from "../agents/agent_types.ts";

type RunRealFollowupInput = {
  telegramReplyIntake: TelegramReplyIntake;
  replyFeedbackBridge: ReplyFeedbackBridge;
  controlledFollowupPreview?: ControlledFollowupPreview;
};

export function runRealFollowup(
  input: RunRealFollowupInput,
): RealFollowupResult {
  const replyType = input.telegramReplyIntake.telegram_reply_intake.reply_type;
  const followupActionType = replyType === "quote_request" ? "prepare_quote" : "prepare_message";
  const followupStatus = replyType === "rejection" ? "blocked" : "ready_for_approval";
  const controlledPreview = input.controlledFollowupPreview?.followup_preview;
  const defaultPreview = followupActionType === "prepare_quote"
    ? [
      "Prepare a Telegram quote reply draft that answers the inbound quote request.",
      "Keep the quote reply inside the approval gate before any second outbound send.",
    ]
    : replyType === "rejection"
      ? [
        "Stop Telegram outreach for this lead.",
        "Record the rejection instead of preparing another outbound follow-up.",
      ]
      : [
        "Prepare the next Telegram follow-up message draft for approval.",
        "Keep the follow-up inside the controlled approval loop before any send.",
      ];

  return {
    followup_result: {
      linked_reply_id: input.telegramReplyIntake.telegram_reply_intake.reply_id,
      followup_action_type: followupActionType,
      followup_preview: controlledPreview?.followup_content_preview ?? defaultPreview,
      followup_status: followupStatus,
    },
    followup_summary: [
      `Reply type: ${replyType}.`,
      `Follow-up action type: ${followupActionType}.`,
      `Follow-up status: ${followupStatus}.`,
      `Prioritized next offer actions: ${input.replyFeedbackBridge.reply_feedback_bridge.monetization_feedback.next_offer_action.join(", ") || "none"}.`,
    ],
  };
}
