import type {
  BatchApprovalInputSurface,
  BatchDecisionIngress,
} from "../agents/agent_types.ts";
import { buildApprovalInputSurface } from "./approval_input_surface.ts";
import { ingestHumanDecision } from "./human_decision_ingress.ts";

export type RawBatchHumanDecisionInput = {
  actor_id?: string;
  review_ids?: string[];
  decisions?: ("approved" | "rejected" | "revise_required")[];
  decision_notes?: string[][];
  revision_rounds?: (number | undefined)[];
  target_type?: "review_pack" | "approval_session";
};

type IngestBatchHumanDecisionsInput = {
  rawBatchDecision: RawBatchHumanDecisionInput;
  batchApprovalInputSurface: BatchApprovalInputSurface;
};

export function ingestBatchHumanDecisions(
  input: IngestBatchHumanDecisionsInput,
): BatchDecisionIngress {
  const issues: string[] = [];
  const reviewIds = input.rawBatchDecision.review_ids ?? [];
  const decisions = input.rawBatchDecision.decisions ?? [];
  const decisionNotes = input.rawBatchDecision.decision_notes ?? [];
  const revisionRounds = input.rawBatchDecision.revision_rounds ?? [];

  if (reviewIds.length !== decisions.length) {
    issues.push("review_ids and decisions must use the same length.");
  }

  if (reviewIds.length > input.batchApprovalInputSurface.batch_input_surface.supported_batch_size) {
    issues.push(
      `Batch size exceeds supported limit ${input.batchApprovalInputSurface.batch_input_surface.supported_batch_size}.`,
    );
  }

  if (decisionNotes.length > 0 && decisionNotes.length !== reviewIds.length) {
    issues.push("decision_notes must align with review_ids when provided.");
  }

  if (revisionRounds.length > 0 && revisionRounds.length !== reviewIds.length) {
    issues.push("revision_rounds must align with review_ids when provided.");
  }

  const approvalInputSurface = buildApprovalInputSurface();
  const batchDecisionPayloads = reviewIds.map((reviewId, index) =>
    ingestHumanDecision({
      rawDecision: {
        actor_id: input.rawBatchDecision.actor_id,
        review_id: reviewId,
        decision: decisions[index],
        decision_notes: decisionNotes[index] ?? [],
        revision_round: revisionRounds[index],
        target_type: input.rawBatchDecision.target_type ?? "review_pack",
      },
      approvalInputSurface,
    })
  );

  const invalidPayloadIssues = batchDecisionPayloads.flatMap((payload, index) =>
    payload.ingress_validation.valid
      ? []
      : payload.ingress_validation.issues.map((issue) => `index ${index}: ${issue}`)
  );
  const allIssues = [...issues, ...invalidPayloadIssues];
  const validPayloadCount = batchDecisionPayloads.filter((payload) => payload.ingress_validation.valid).length;

  return {
    batch_decision_payloads: batchDecisionPayloads.map((payload) => payload.decision_payload),
    batch_ingress_validation: {
      valid: allIssues.length === 0,
      issues: allIssues,
    },
    batch_ingress_summary: [
      `Ingested ${batchDecisionPayloads.length} batch decision(s).`,
      `Valid decisions: ${validPayloadCount}; invalid decisions: ${batchDecisionPayloads.length - validPayloadCount}.`,
      allIssues.length > 0 ? `Batch ingress issues: ${allIssues.join(" | ")}.` : "All batch decisions are valid.",
    ],
  };
}
