export function classifyLeadMessage(message) {
  const s = (message || "").toLowerCase();

  if (/報價|quote|多少/.test(s)) {
    return {
      reply_type: "quote_request",
      lead_stage: "quote_ready",
      next_step: "send_quote_reply"
    };
  }

  if (/有興趣|interest|了解/.test(s)) {
    return {
      reply_type: "interest",
      lead_stage: "followup_ready",
      next_step: "send_followup_reply"
    };
  }

  if (/不用|no thanks|拒絕/.test(s)) {
    return {
      reply_type: "rejection",
      lead_stage: "lost",
      next_step: "stop_outreach"
    };
  }

  return {
    reply_type: "unknown",
    lead_stage: "reply_received",
    next_step: "review_manually"
  };
}
