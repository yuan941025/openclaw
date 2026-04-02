import type {
  ActorDecisionAudit,
  ApprovalActorRegistry,
  BatchDecisionIngress,
  SessionAssignmentRoutes,
} from "../agents/agent_types.ts";
import { createDecisionAuditEntry } from "./decision_audit_trail.ts";

type BuildActorDecisionAuditInput = {
  actorRegistry: ApprovalActorRegistry;
  decisionPayload?: {
    decision_payload: {
      actor_id: string;
      review_id: string;
      decision: "approved" | "rejected" | "revise_required";
      decision_notes: string[];
      revision_round?: number;
      target_type: "review_pack" | "approval_session";
    };
    ingress_validation: { valid: boolean; issues: string[] };
  };
  batchDecisionPayloads?: BatchDecisionIngress;
  assignmentRoutes: SessionAssignmentRoutes;
};

export function buildActorDecisionAudit(
  input: BuildActorDecisionAuditInput,
): ActorDecisionAudit {
  const authorityByActor = new Map(
    input.actorRegistry.actor_registry.map((actor) => [actor.actor_id, actor.authority_level]),
  );
  const routeByReview = new Map(
    input.assignmentRoutes.assignment_routes.map((route) => [route.review_id, route.assigned_actor_id]),
  );
  const payloads = input.batchDecisionPayloads?.batch_decision_payloads
    ?? (input.decisionPayload?.ingress_validation.valid ? [input.decisionPayload.decision_payload] : []);

  const actorAuditTrail = payloads.map((payload, index) => {
    const auditEntry = createDecisionAuditEntry(payload, index + 1);
    const actorId = routeByReview.get(payload.review_id) || payload.actor_id;
    return {
      actor_id: actorId,
      review_id: payload.review_id,
      action: payload.decision,
      authority_level: authorityByActor.get(actorId) ?? "standard",
      audit_label: `actor_audit_step_${index + 1}`,
    };
  });

  return {
    actor_audit_trail: actorAuditTrail,
    actor_audit_summary: actorAuditTrail.length > 0
      ? actorAuditTrail.map((entry) =>
        `${entry.actor_id} handled ${entry.review_id} with ${entry.action}.`
      )
      : ["No actor-level audit entries were recorded."],
  };
}
