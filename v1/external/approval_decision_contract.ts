import type {
  ApprovalDecisionContract,
  OutboundReviewPackResult,
} from "../agents/agent_types.ts";

export type ApprovalDecisionOverrideEntry = {
  review_id: string;
  decision: "approved" | "rejected" | "revise_required";
  decision_notes: string[];
  revision_round?: number;
};

export type ApprovalDecisionOverrideResult = {
  decision_overrides: ApprovalDecisionOverrideEntry[];
  validation: {
    valid: boolean;
    errors: string[];
  };
  override_summary: string[];
};

type LegacyDecisionOverride = {
  review_id: string;
  decision: "approve" | "reject" | "revise";
  decision_notes?: string[];
  revised_content?: string[];
};

type BuildApprovalDecisionContractInput = {
  outboundReviewPack: OutboundReviewPackResult;
  decisionOverrides?: (LegacyDecisionOverride | ApprovalDecisionOverrideEntry)[];
};

type ValidateApprovalDecisionOverrideInput = {
  decision_overrides: ApprovalDecisionOverrideEntry[];
};

type BuildApprovalDecisionOverrideInput = {
  outboundReviewPack: OutboundReviewPackResult;
  overrides?: ApprovalDecisionOverrideEntry[];
};

function mapOverrideDecisionToContractDecision(
  decision: ApprovalDecisionOverrideEntry["decision"],
): ApprovalDecisionContract["decisions"][number]["decision"] {
  if (decision === "rejected") {
    return "reject";
  }

  if (decision === "revise_required") {
    return "revise";
  }

  return "approve";
}

function normalizeLegacyOverride(
  override: LegacyDecisionOverride | ApprovalDecisionOverrideEntry,
): {
  review_id: string;
  decision: ApprovalDecisionContract["decisions"][number]["decision"];
  decision_notes: string[] | undefined;
  revised_content?: string[];
  revision_round?: number;
} {
  if (
    override.decision === "approved"
    || override.decision === "rejected"
    || override.decision === "revise_required"
  ) {
    return {
      review_id: override.review_id,
      decision: mapOverrideDecisionToContractDecision(override.decision),
      decision_notes: override.decision_notes,
      revision_round: override.revision_round,
    };
  }

  return {
    review_id: override.review_id,
    decision: override.decision,
    decision_notes: override.decision_notes,
    revised_content: override.revised_content,
  };
}

function getHighestRevisionOverride(
  overrides: (LegacyDecisionOverride | ApprovalDecisionOverrideEntry)[],
) {
  const normalizedOverrides = overrides.map(normalizeLegacyOverride);
  const grouped = new Map<string, ReturnType<typeof normalizeLegacyOverride>[]>();
  for (const override of normalizedOverrides) {
    const current = grouped.get(override.review_id) ?? [];
    current.push(override);
    grouped.set(override.review_id, current);
  }

  return new Map(
    [...grouped.entries()].map(([reviewId, reviewOverrides]) => {
      const selected = [...reviewOverrides].sort((left, right) => {
        const leftRound = left.revision_round ?? 1;
        const rightRound = right.revision_round ?? 1;
        return rightRound - leftRound;
      })[0];
      return [reviewId, selected];
    }),
  );
}

export function validateApprovalDecisionOverride(
  input: ValidateApprovalDecisionOverrideInput,
): ApprovalDecisionOverrideResult["validation"] {
  const errors: string[] = [];

  for (const override of input.decision_overrides) {
    if (!override.review_id.trim()) {
      errors.push("review_id is required for approval decision overrides.");
    }

    if (override.decision === "revise_required" && override.decision_notes.length === 0) {
      errors.push(`Override ${override.review_id} must include decision_notes for revise_required.`);
    }

    if (
      override.decision === "rejected"
      && override.decision_notes.some((note) => /approved|approve/i.test(note))
    ) {
      errors.push(`Override ${override.review_id} cannot describe approved content when decision is rejected.`);
    }

    if (override.revision_round !== undefined && override.revision_round < 1) {
      errors.push(`Override ${override.review_id} must use revision_round >= 1.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function buildStaticOverrideEntries(
  outboundReviewPack: OutboundReviewPackResult,
): ApprovalDecisionOverrideEntry[] {
  return outboundReviewPack.review_packs.flatMap((reviewPack) => {
    if (reviewPack.action_type === "send_message") {
      return [
        {
          review_id: reviewPack.review_id,
          decision: "revise_required",
          decision_notes: [
            `Revise ${reviewPack.action_type} before final approval.`,
            "Tighten the outbound wording before controlled execution.",
          ],
          revision_round: 1,
        },
        {
          review_id: reviewPack.review_id,
          decision: "approved",
          decision_notes: [
            `Approved ${reviewPack.action_type} after revision review.`,
          ],
          revision_round: 2,
        },
      ];
    }

    if (reviewPack.action_type === "publish_post") {
      return [
        {
          review_id: reviewPack.review_id,
          decision: "approved",
          decision_notes: [
            `Approved ${reviewPack.action_type} on the first review round.`,
          ],
          revision_round: 1,
        },
      ];
    }

    if (reviewPack.action_type === "create_invoice") {
      return [
        {
          review_id: reviewPack.review_id,
          decision: "rejected",
          decision_notes: [
            `Rejected ${reviewPack.action_type}; keep it in safe preparation mode.`,
          ],
          revision_round: 1,
        },
      ];
    }

    return [
      {
        review_id: reviewPack.review_id,
        decision: "approved",
        decision_notes: [
          `Approved ${reviewPack.action_type} on the first review round.`,
        ],
        revision_round: 1,
      },
    ];
  });
}

export function buildApprovalDecisionOverride(
  input: BuildApprovalDecisionOverrideInput,
): ApprovalDecisionOverrideResult {
  const decisionOverrides = input.overrides ?? buildStaticOverrideEntries(input.outboundReviewPack);
  const validation = validateApprovalDecisionOverride({
    decision_overrides: decisionOverrides,
  });

  return {
    decision_overrides: decisionOverrides,
    validation,
    override_summary: [
      `Built ${decisionOverrides.length} approval decision override entries.`,
      `Override validation: ${validation.valid ? "valid" : "invalid"}.`,
      `Revised reviews: ${[...new Set(decisionOverrides.filter((override) => override.decision === "revise_required").map((override) => override.review_id))].join(", ") || "none"}.`,
    ],
  };
}

export function buildApprovalDecisionContract(
  input: BuildApprovalDecisionContractInput,
): ApprovalDecisionContract {
  const overrideLookup = getHighestRevisionOverride(input.decisionOverrides ?? []);
  const decisions = input.outboundReviewPack.review_packs.map((reviewPack) => {
    const override = overrideLookup.get(reviewPack.review_id);
    const decision = override?.decision ?? "approve";

    return {
      review_id: reviewPack.review_id,
      action_type: reviewPack.action_type,
      source_agent_id: reviewPack.source_agent_id,
      decision,
      decision_source: override ? "override" : "default",
      decision_notes: override?.decision_notes ?? [
        decision === "approve"
          ? `Approved ${reviewPack.action_type} simulation for controlled outbound review.`
          : decision === "reject"
            ? `Rejected ${reviewPack.action_type}; keep it in internal preparation mode.`
            : `Revise ${reviewPack.action_type} before the next outbound simulation cycle.`,
      ],
      revised_content: override?.revised_content,
    };
  });

  return {
    decision_schema: {
      allowed_decisions: ["approve", "reject", "revise"],
      required_fields: ["review_id", "decision", "decision_notes"],
      optional_fields: ["revised_content", "revision_round"],
    },
    decisions,
    decision_summary: [
      `Built approval decisions for ${decisions.length} review pack(s).`,
      "Decision schema supports approve, reject, and revise.",
      `Approved actions: ${decisions.filter((decision) => decision.decision === "approve").map((decision) => decision.review_id).join(", ") || "none"}.`,
    ],
  };
}
