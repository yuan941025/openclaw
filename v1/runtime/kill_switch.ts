import type { KillSwitchState } from "../agents/agent_types.ts";

const DISABLED_VALUES = new Set(["0", "false", "off", "disabled", "no"]);

function isKillSwitchEnabled(): boolean {
  const value = process.env.OPENCLAW_V1_KILL_SWITCH_ENABLED;
  if (!value) {
    return true;
  }

  return !DISABLED_VALUES.has(value.trim().toLowerCase());
}

export function getKillSwitchState(): KillSwitchState {
  const isEnabled = isKillSwitchEnabled();
  const reason = isEnabled
    ? undefined
    : "OPENCLAW_V1_KILL_SWITCH_ENABLED disabled real execution.";

  return {
    kill_switch: {
      is_enabled: isEnabled,
      reason,
    },
    kill_switch_summary: [
      `Kill switch allows execution: ${isEnabled.toString()}.`,
      reason ?? "Kill switch remains open for a guarded real execution run.",
    ],
  };
}

export function assertKillSwitchAllowsExecution(
  state: KillSwitchState = getKillSwitchState(),
): void {
  if (!state.kill_switch.is_enabled) {
    throw new Error(
      state.kill_switch.reason ?? "Kill switch blocked real execution.",
    );
  }
}
