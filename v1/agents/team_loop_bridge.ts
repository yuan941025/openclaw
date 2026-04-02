import type {
  AgentFeedbackRouting,
  AgentLoopPreview,
  AgentPlan,
  TeamExecutionReceipt,
  TeamLoopBridge,
  TeamRecoveryPreview,
} from "./agent_types.ts";

type MinimalSelfBuildResult = {
  goal?: string;
  goal_summary?: string;
  plan?: {
    proposed_modules?: { name?: string; purpose?: string; priority?: string }[];
    missing_capabilities?: string[];
    current_capabilities?: string[];
  };
  build_spec?: {
    execution_steps?: string[];
    files_to_create?: { path: string; purpose: string }[];
    files_to_modify?: { path: string; purpose: string }[];
  };
};

type BuildTeamLoopBridgeInput = {
  selfBuildResult: MinimalSelfBuildResult;
  teamReceipt?: TeamExecutionReceipt;
  loopPreview?: AgentLoopPreview;
  teamResult?: {
    agent_plan?: AgentPlan;
    feedback_routing?: AgentFeedbackRouting;
    recovery_preview?: TeamRecoveryPreview;
  };
};

function getSelfBuildGoal(selfBuildResult: MinimalSelfBuildResult): string {
  return selfBuildResult.goal
    ?? selfBuildResult.goal_summary
    ?? "build a self-building lobster agent";
}

function deriveTeamGoal(selfBuildGoal: string): string {
  const goalText = selfBuildGoal.toLowerCase();

  if (goalText.includes("self-build") || goalText.includes("self build") || goalText.includes("self-building")) {
    return "prepare coder/tester/operator team path for self-build execution";
  }

  if (
    goalText.includes("architecture")
    || goalText.includes("analysis")
    || goalText.includes("planning")
  ) {
    return "prepare researcher/coder/tester team path for architecture delivery";
  }

  return "prepare coder/tester/operator team path for controlled execution";
}

function buildMappedFocus(
  selfBuildResult: MinimalSelfBuildResult,
  input: BuildTeamLoopBridgeInput,
): string[] {
  const goalText = getSelfBuildGoal(selfBuildResult).toLowerCase();
  const mappedFocus: string[] = [];
  const teamRoles = input.teamResult?.agent_plan?.required_agents.map((agent) => agent.role) ?? [];

  if (
    goalText.includes("architecture")
    || goalText.includes("analysis")
    || teamRoles.includes("researcher")
  ) {
    mappedFocus.push("architecture_gap_review -> researcher");
  }
  if (
    goalText.includes("build")
    || goalText.includes("module")
    || (selfBuildResult.build_spec?.files_to_create?.length ?? 0) > 0
    || (selfBuildResult.build_spec?.files_to_modify?.length ?? 0) > 0
  ) {
    mappedFocus.push("module_delivery -> coder");
  }
  if (
    goalText.includes("feedback")
    || goalText.includes("loop")
    || teamRoles.includes("tester")
  ) {
    mappedFocus.push("validation_loop -> tester");
  }
  if (
    goalText.includes("execution")
    || goalText.includes("trigger")
    || goalText.includes("run")
    || teamRoles.includes("operator")
  ) {
    mappedFocus.push("controlled_execution -> operator");
  }

  return [...new Set(mappedFocus)];
}

export function buildTeamLoopBridge(
  input: BuildTeamLoopBridgeInput,
): TeamLoopBridge {
  const selfBuildGoal = getSelfBuildGoal(input.selfBuildResult);
  const derivedTeamGoal = deriveTeamGoal(selfBuildGoal);
  const bridgeStatus = input.teamReceipt || input.loopPreview || input.teamResult?.recovery_preview
    ? "linked"
    : "partial";
  const recoveryHint = input.teamResult?.recovery_preview?.next_team_goal_hint
    ?? input.loopPreview?.next_team_goal_hint;

  return {
    self_build_goal: selfBuildGoal,
    derived_team_goal: derivedTeamGoal,
    team_bridge_status: bridgeStatus,
    mapped_team_focus: buildMappedFocus(input.selfBuildResult, input),
    bridge_notes: [
      `Derived team goal from self-build goal: ${derivedTeamGoal}.`,
      `Bridge status: ${bridgeStatus}.`,
      ...(recoveryHint ? [`Current team recovery hint: ${recoveryHint}`] : []),
    ],
    next_joint_step: recoveryHint
      ? `Use the self-build goal to align the next team cycle: ${recoveryHint}`
      : bridgeStatus === "linked"
        ? "Use the derived team goal to align self-build modules with the current team replay path."
        : "Prepare a team planning preview from the self-build goal before bridging live receipts.",
  };
}
