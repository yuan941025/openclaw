import type {
  ApprovalInputSurface,
  HumanDecisionPayload,
} from "../agents/agent_types.ts";

export type RawHumanDecisionInput = Partial<HumanDecisionPayload["decision_payload"]>;

type IngestHumanDecisionInput = {
  rawDecision: RawHumanDecisionInput;
  approvalInputSurface: ApprovalInputSurface;
};

type ValidatedHumanDecisionInput = {
  issues: string[];
  normalizedDecision: HumanDecisionPayload["decision_payload"]["decision"];
  normalizedDecisionNotes: string[];
  normalizedTargetType: HumanDecisionPayload["decision_payload"]["target_type"];
};

export function validateHumanDecisionInput(
  rawDecision: RawHumanDecisionInput,
  approvalInputSurface: ApprovalInputSurface,
): ValidatedHumanDecisionInput {
  const issues: string[] = [];
  const supportedDecisions = new Set(approvalInputSurface.input_surface.supported_decisions);
  const supportedTargets = new Set(approvalInputSurface.input_surface.supported_targets);
  const decision = rawDecision.decision ?? "revise_required";
  const decisionNotes = rawDecision.decision_notes ?? [];
  const targetType = rawDecision.target_type ?? "review_pack";

  if (!rawDecision.review_id?.trim()) {
    issues.push("review_id is required.");
  }

  if (!rawDecision.decision) {
    issues.push("decision is required.");
  } else if (!supportedDecisions.has(rawDecision.decision)) {
    issues.push(`decision ${rawDecision.decision} is not supported.`);
  }

  if (decision === "revise_required" && decisionNotes.length === 0) {
    issues.push("revise_required decisions must include decision_notes.");
  }

  if (rawDecision.revision_round !== undefined && rawDecision.revision_round < 1) {
    issues.push("revision_round must be >= 1.");
  }

  if (!supportedTargets.has(targetType)) {
    issues.push(`target_type ${targetType} is not supported.`);
  }

  return {
    issues,
    normalizedDecision: decision,
    normalizedDecisionNotes: decisionNotes,
    normalizedTargetType: targetType,
  };
}

export function ingestHumanDecision(
  input: IngestHumanDecisionInput,
): HumanDecisionPayload {
  const validation = validateHumanDecisionInput(input.rawDecision, input.approvalInputSurface);
  const valid = validation.issues.length === 0;

  return {
    decision_payload: {
      actor_id: input.rawDecision.actor_id?.trim() || "human_reviewer_1",
      review_id: input.rawDecision.review_id?.trim() || "",
      decision: validation.normalizedDecision,
      decision_notes: validation.normalizedDecisionNotes,
      revision_round: input.rawDecision.revision_round,
      target_type: validation.normalizedTargetType,
    },
    ingress_validation: {
      valid,
      issues: validation.issues,
    },
    ingress_summary: [
      `Human decision payload is ${valid ? "valid" : "invalid"}.`,
      validation.issues.length > 0
        ? `Ingress issues: ${validation.issues.join(" | ")}.`
        : `Prepared ${validation.normalizedDecision} decision for ${input.rawDecision.review_id ?? "unknown_review"}.`,
    ],
  };
}
