import type {
  DecisionAuditTrail,
  HumanDecisionPayload,
  ReviewOverrideUpdate,
} from "../agents/agent_types.ts";

type BuildDecisionAuditTrailInput = {
  decisionPayload: HumanDecisionPayload;
  overrideUpdate: ReviewOverrideUpdate;
};

export function createDecisionAuditEntry(
  payload: HumanDecisionPayload["decision_payload"],
  auditIndex: number,
) {
  return {
    audit_id: `decision_audit_${auditIndex}`,
    actor_id: payload.actor_id,
    review_id: payload.review_id,
    decision: payload.decision,
    revision_round: payload.revision_round,
    timestamp_label: `decision_step_${auditIndex}`,
  };
}

export function buildDecisionAuditTrail(
  input: BuildDecisionAuditTrailInput,
): DecisionAuditTrail {
  const payload = input.decisionPayload.decision_payload;
  const auditTrail = input.decisionPayload.ingress_validation.valid
    ? [createDecisionAuditEntry(payload, 1)]
    : [];

  return {
    audit_trail: auditTrail,
    audit_summary: auditTrail.length > 0
      ? [
        `${payload.actor_id} changed ${payload.review_id} to ${payload.decision}.`,
        `Override update status: ${input.overrideUpdate.override_update.update_status}.`,
      ]
      : ["No audit trail was recorded because the human decision payload was invalid."],
  };
}
