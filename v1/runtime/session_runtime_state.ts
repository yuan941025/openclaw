import type {
  LeadStage,
  RuntimeSessionState,
} from "../agents/agent_types.ts";

type BuildRuntimeSessionStateInput = {
  sessionId: string;
  outboundIncrement?: number;
  lastOutboundReviewId?: string;
  lastReplyId?: string;
  nextStage?: LeadStage;
};

const runtimeSessions = new Map<string, RuntimeSessionState["runtime_session"]>();

export function buildRuntimeSessionState(
  input: BuildRuntimeSessionStateInput,
): RuntimeSessionState {
  const existing = runtimeSessions.get(input.sessionId) ?? {
    session_id: input.sessionId,
    outbound_count: 0,
    current_lead_stage: "lead_open" as LeadStage,
  };

  const updated: RuntimeSessionState["runtime_session"] = {
    ...existing,
    outbound_count: existing.outbound_count + (input.outboundIncrement ?? 0),
    current_lead_stage: input.nextStage ?? existing.current_lead_stage,
    last_outbound_review_id: input.lastOutboundReviewId ?? existing.last_outbound_review_id,
    last_reply_id: input.lastReplyId ?? existing.last_reply_id,
  };

  runtimeSessions.set(input.sessionId, updated);

  return {
    runtime_session: updated,
    runtime_summary: [
      `Runtime session: ${updated.session_id}.`,
      `Outbound count: ${updated.outbound_count}.`,
      `Current lead stage: ${updated.current_lead_stage}.`,
      `Last outbound review: ${updated.last_outbound_review_id ?? "none"}.`,
      `Last reply id: ${updated.last_reply_id ?? "none"}.`,
    ],
  };
}
