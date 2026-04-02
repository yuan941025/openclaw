import { buildInboundLead } from "./inbound_builder.ts";
import { classifyLeadMessage } from "./lead_classifier.ts";
import { buildQuoteReplyPack } from "./quote_reply_builder.ts";
import { buildFollowupReplyPack } from "./followup_reply_builder.ts";

export function runLeadFlow(source, platform, message) {
  const lead = buildInboundLead(source, platform, message);
  const decision = classifyLeadMessage(message);

  let reply_pack = null;

  if (decision.reply_type === "quote_request") {
    reply_pack = buildQuoteReplyPack(message);
  } else if (decision.reply_type === "interest") {
    reply_pack = buildFollowupReplyPack(message);
  }

  return {
    lead,
    decision,
    reply_pack,
    result: {
      lead_id: lead.lead_id,
      lead_stage: decision.lead_stage,
      reply_type: decision.reply_type,
      next_step: decision.next_step
    }
  };
}
