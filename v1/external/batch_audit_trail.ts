import type {
  BatchAuditTrail,
  BatchDecisionIngress,
} from "../agents/agent_types.ts";

type BuildBatchDecisionAuditTrailInput = {
  batchDecisionPayloads: BatchDecisionIngress;
};

export function buildBatchDecisionAuditTrail(
  input: BuildBatchDecisionAuditTrailInput,
): BatchAuditTrail {
  const auditTrail = input.batchDecisionPayloads.batch_decision_payloads.map((payload, index) => ({
    audit_id: `batch_decision_audit_${index + 1}`,
    actor_id: payload.actor_id,
    review_id: payload.review_id,
    decision: payload.decision,
    revision_round: payload.revision_round,
    timestamp_label: `batch_decision_step_${index + 1}`,
  }));

  return {
    batch_audit_trail: auditTrail,
    batch_audit_summary: auditTrail.map((entry) =>
      `${entry.actor_id} set ${entry.review_id} to ${entry.decision}.`
    ),
  };
}
