import type {
  ApprovalDecisionContract,
  ApprovalReviewSession,
  DecisionReplay,
} from "../agents/agent_types.ts";
import type { ApprovalDecisionOverrideResult } from "./approval_decision_contract.ts";

type ReplayApprovalDecisionsInput = {
  approvalReviewSession: ApprovalReviewSession;
  approvalDecisionContract: ApprovalDecisionContract;
  approvalDecisionOverride?: ApprovalDecisionOverrideResult;
};

function mapOverrideDecision(
  decision: ApprovalDecisionContract["decisions"][number]["decision"],
): DecisionReplay["decision_history"][number]["decision"] {
  if (decision === "reject") {
    return "rejected";
  }

  if (decision === "revise") {
    return "revise_required";
  }

  return "approved";
}

function getStaticReplayDecision(
  actionType: string,
): DecisionReplay["decision_history"][number]["decision"] {
  if (actionType === "send_message") {
    return "revise_required";
  }

  if (actionType === "create_invoice") {
    return "rejected";
  }

  return "approved";
}

export function replayApprovalDecisions(
  input: ReplayApprovalDecisionsInput,
): DecisionReplay {
  const reviewIds = new Set(input.approvalReviewSession.review_session.review_ids);
  const decisionOverrides = input.approvalDecisionOverride?.decision_overrides.filter((override) =>
    reviewIds.has(override.review_id)
  ) ?? [];
  const overrideLookup = new Map<string, typeof decisionOverrides>();
  for (const override of decisionOverrides) {
    const current = overrideLookup.get(override.review_id) ?? [];
    current.push(override);
    overrideLookup.set(override.review_id, current);
  }

  const decisionHistory = input.approvalDecisionContract.decisions
    .filter((decision) => reviewIds.has(decision.review_id))
    .flatMap((decision) => {
      const overrides = overrideLookup.get(decision.review_id);
      if (overrides && overrides.length > 0) {
        return [...overrides]
          .sort((left, right) => (left.revision_round ?? 1) - (right.revision_round ?? 1))
          .map((override) => ({
            review_id: decision.review_id,
            decision: override.decision,
            decision_notes: [
              ...override.decision_notes,
              "Used explicit decision override from the approval patch layer.",
            ],
            revision_round: override.revision_round ?? 1,
          }));
      }

      const replayDecision = decision.decision_source === "override"
        ? mapOverrideDecision(decision.decision)
        : getStaticReplayDecision(decision.action_type);

      return [{
        review_id: decision.review_id,
        decision: replayDecision,
        decision_notes: decision.decision_source === "override"
          ? [
            ...decision.decision_notes,
            "Used explicit decision override from the approval contract.",
          ]
          : [
            `Applied static replay rule for ${decision.action_type}.`,
            ...decision.decision_notes,
          ],
        revision_round: replayDecision === "revise_required" ? 1 : 1,
      }];
    })
    .map((entry, index) => ({
      replay_id: `decision_replay_${index + 1}`,
      ...entry,
    }));

  const revisedReviewIds = [...new Set(
    decisionHistory
      .filter((entry) => entry.decision === "revise_required")
      .map((entry) => entry.review_id),
  )];
  const approvedAfterRevision = revisedReviewIds.filter((reviewId) =>
    decisionHistory.some((entry) => entry.review_id === reviewId && entry.decision === "approved")
  );
  const rejectedAfterRevision = revisedReviewIds.filter((reviewId) =>
    decisionHistory.some((entry) => entry.review_id === reviewId && entry.decision === "rejected")
  );

  return {
    session_id: input.approvalReviewSession.review_session.session_id,
    decision_history: decisionHistory,
    replay_summary: [
      `Revise-required reviews: ${revisedReviewIds.join(", ") || "none"}.`,
      `Approved reviews: ${[...new Set(decisionHistory.filter((entry) => entry.decision === "approved").map((entry) => entry.review_id))].join(", ") || "none"}.`,
      `Rejected reviews: ${[...new Set(decisionHistory.filter((entry) => entry.decision === "rejected").map((entry) => entry.review_id))].join(", ") || "none"}.`,
      `Approved after revision: ${approvedAfterRevision.join(", ") || "none"}.`,
      `Still rejected after revision: ${rejectedAfterRevision.join(", ") || "none"}.`,
    ],
  };
}
