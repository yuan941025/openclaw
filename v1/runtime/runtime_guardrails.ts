import type { RuntimeGuardrails } from "../agents/agent_types.ts";

const DEFAULT_ALLOWED_CHANNELS = ["telegram"];
const DEFAULT_BLOCKED_ACTIONS = ["collect_payment", "modify_account"];

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function buildRuntimeGuardrails(): RuntimeGuardrails {
  const safeMode = process.env.OPENCLAW_V1_SAFE_MODE !== "0";
  const approvalRequired = process.env.OPENCLAW_V1_APPROVAL_REQUIRED !== "0";
  const maxOutboundPerRun = parsePositiveInteger(
    process.env.OPENCLAW_V1_MAX_OUTBOUND_PER_RUN,
    1,
  );

  return {
    guardrails: {
      safe_mode: safeMode,
      approval_required: approvalRequired,
      allowed_channels: [...DEFAULT_ALLOWED_CHANNELS],
      blocked_actions: [...DEFAULT_BLOCKED_ACTIONS],
      max_outbound_per_run: maxOutboundPerRun,
    },
    guardrail_summary: [
      `Allowed real channels: ${DEFAULT_ALLOWED_CHANNELS.join(", ")}.`,
      `Approval gate required: ${approvalRequired.toString()}.`,
      `Safe mode preserved: ${safeMode.toString()}.`,
      `Blocked actions: ${DEFAULT_BLOCKED_ACTIONS.join(", ")}.`,
      `Max outbound actions per run: ${maxOutboundPerRun}.`,
    ],
  };
}
