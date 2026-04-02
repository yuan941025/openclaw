export function buildInboundLead(source, platform, content) {
  return {
    lead_id: "lead_" + Date.now(),
    source,
    platform,
    content,
    status: "new"
  };
}
