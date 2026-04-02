import type {
  ReplyIntakeContract,
  RevenueLaneSessionMap,
} from "../agents/agent_types.ts";

type BuildReplyIntakeContractInput = {
  laneSessionMap: RevenueLaneSessionMap;
};

export function buildReplyIntakeContract(
  input: BuildReplyIntakeContractInput,
): ReplyIntakeContract {
  const isQuoteLane = input.laneSessionMap.lane_session_map.mapped_offer_type === "AI quote service";

  return {
    reply_intake_contract: {
      reply_id: "reply_intake_1",
      source_channel: isQuoteLane ? "quote_reply_stub" : "content_reply_stub",
      sender_type: isQuoteLane ? "customer" : "lead",
      reply_type: isQuoteLane ? "quote_request" : "interest",
      reply_summary: isQuoteLane
        ? [
          "Customer asked for a formal quote after reviewing the draft offer.",
          "The reply indicates the next step should focus on quote preparation.",
        ]
        : [
          "Lead showed interest in the prepared AI content service offer.",
          "The reply signals a follow-up message path instead of a direct send.",
        ],
      linked_session_id: input.laneSessionMap.lane_session_map.session_id,
    },
  };
}
