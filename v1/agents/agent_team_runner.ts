import { fileURLToPath } from "node:url";
import { runAgentPlanning } from "./agent_planner.ts";
import { runAgentAssignment } from "./agent_assignment.ts";
import { buildSubAgentTemplates } from "./sub_agent_template_builder.ts";
import { buildCoordinationPlan } from "./coordination_planner.ts";
import { mergeAgentResults } from "./result_merger.ts";
import { exportAgentExecutionBundles } from "./agent_bundle_exporter.ts";
import { simulateTeamExecution } from "./team_execution_simulator.ts";
import { buildTeamExecutionReceipt } from "./team_execution_receipt.ts";
import { routeAgentFeedback } from "./agent_feedback_router.ts";
import { validateTeamBundles } from "./team_bundle_validator.ts";
import { checkHandoffConsistency } from "./handoff_consistency_checker.ts";
import { replayTeamExecution } from "./team_replay_runner.ts";
import { buildTeamReplayReceipt } from "./team_replay_receipt.ts";
import { previewNextAgentLoop } from "./agent_loop_preview.ts";
import { injectReplayFailures } from "./failure_injector.ts";
import { getFailureScenarioProfile } from "./failure_injector.ts";
import { buildDegradedReplayReceipt } from "./degraded_replay_receipt.ts";
import { routeRepairActions } from "./repair_router.ts";
import { previewTeamRecovery } from "./team_recovery_preview.ts";
import { buildTeamLoopBridge } from "./team_loop_bridge.ts";
import type {
  AgentPlan,
  FailureScenarioProfile,
  ReplayFailureInjection,
  TeamMergeResult,
} from "./agent_types.ts";

export type AgentTeamFlowOptions = {
  failureConfig?: ReplayFailureInjection[];
  failureScenarioId?: string;
  selfBuildPreview?: Parameters<typeof buildTeamLoopBridge>[0]["selfBuildResult"];
};

export type AgentTeamExecutionResult = {
  goal_summary: string;
  agent_plan: AgentPlan;
  team_plan: TeamMergeResult["team_plan"];
  team_result_merge: TeamMergeResult;
  execution_bundles: ReturnType<typeof exportAgentExecutionBundles>;
  simulation_result: ReturnType<typeof simulateTeamExecution>;
  team_receipt: ReturnType<typeof buildTeamExecutionReceipt>;
  feedback_routing: ReturnType<typeof routeAgentFeedback>;
  bundle_validation: ReturnType<typeof validateTeamBundles>;
  handoff_consistency: ReturnType<typeof checkHandoffConsistency>;
  replay_result: ReturnType<typeof replayTeamExecution>;
  replay_receipt: ReturnType<typeof buildTeamReplayReceipt>;
  loop_preview: ReturnType<typeof previewNextAgentLoop>;
  failure_scenario_profile?: FailureScenarioProfile;
  degraded_replay_result: ReturnType<typeof injectReplayFailures>;
  degraded_replay_receipt: ReturnType<typeof buildDegradedReplayReceipt>;
  repair_routing: ReturnType<typeof routeRepairActions>;
  recovery_preview: ReturnType<typeof previewTeamRecovery>;
  team_loop_bridge: ReturnType<typeof buildTeamLoopBridge>;
  next_step: string;
};

const DEFAULT_GOAL =
  "build a self-building lobster agent team with feedback loop and controlled execution";

function parseArgs(argv: string[]): { goal: string; failureScenarioId?: string } {
  const goalParts: string[] = [];
  let failureScenarioId: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--failure-scenario") {
      failureScenarioId = argv[index + 1];
      index += 1;
      continue;
    }

    goalParts.push(argument);
  }

  return {
    goal: goalParts.join(" ").trim() || DEFAULT_GOAL,
    failureScenarioId,
  };
}

function buildSelfBuildPreview(
  goal: string,
  agentPlan: AgentPlan,
  executionBundles: ReturnType<typeof exportAgentExecutionBundles>,
): NonNullable<AgentTeamFlowOptions["selfBuildPreview"]> {
  return {
    goal,
    plan: {
      proposed_modules: agentPlan.required_agents.map((agent) => ({
        name: `${agent.role}_team_path`,
        purpose: agent.purpose,
        priority: agent.priority,
      })),
    },
    build_spec: {
      execution_steps: executionBundles.bundles.flatMap((bundle) =>
        bundle.assigned_tasks.map((task) => `${bundle.agent_id}:${task.title}`)
      ),
      files_to_create: [],
      files_to_modify: [],
    },
  };
}

function buildNextStep(result: AgentTeamExecutionResult): string {
  if (result.degraded_replay_receipt.degraded_status === "completed") {
    return "Degraded replay handled. Prepare real team executor bridge.";
  }

  if (result.repair_routing.prioritize_agents.length > 0) {
    return "Repair prioritized agents before the next team replay cycle.";
  }

  return "Review degraded artifacts and refresh handoff contracts.";
}

export function runAgentTeamFlow(
  goal: string,
  options: AgentTeamFlowOptions = {},
): AgentTeamExecutionResult {
  const failureScenarioProfile = !options.failureConfig && options.failureScenarioId
    ? getFailureScenarioProfile(options.failureScenarioId)
    : undefined;
  if (options.failureScenarioId && !failureScenarioProfile) {
    throw new Error(`Unknown failure scenario: ${options.failureScenarioId}`);
  }
  const agentPlan = runAgentPlanning(goal);
  const assignment = runAgentAssignment(goal);
  const subAgentTemplates = buildSubAgentTemplates(assignment);
  const coordinationPlan = buildCoordinationPlan(assignment, subAgentTemplates);
  const teamMerge = mergeAgentResults({
    goal_summary: goal,
    required_agents: agentPlan.required_agents,
    assignment,
    sub_agent_templates: subAgentTemplates,
    coordination_plan: coordinationPlan,
  });
  const executionBundles = exportAgentExecutionBundles({
    assignmentResult: assignment,
    subAgentTemplates,
    coordinationPlan,
  });
  const simulationResult = simulateTeamExecution({
    executionBundles,
    coordinationPlan,
  });
  const teamReceipt = buildTeamExecutionReceipt(simulationResult);
  const feedbackRouting = routeAgentFeedback(teamReceipt);
  const bundleValidation = validateTeamBundles({
    executionBundles,
    coordinationPlan,
  });
  const handoffConsistency = checkHandoffConsistency({
    executionBundles,
    coordinationPlan,
  });
  const replayResult = replayTeamExecution({
    executionBundles,
    simulationResult,
    coordinationPlan,
  });
  const replayReceipt = buildTeamReplayReceipt({
    replayResult,
    bundleValidation,
    handoffConsistency,
  });
  const loopPreview = previewNextAgentLoop({
    teamReplayReceipt: replayReceipt,
    feedbackRouting,
  });
  const degradedReplayResult = injectReplayFailures({
    executionBundles,
    coordinationPlan,
    simulationResult,
    failureConfig: options.failureConfig,
    failureScenarioId: options.failureConfig ? undefined : options.failureScenarioId,
    failureScenarioProfile,
  });
  const degradedReplayReceipt = buildDegradedReplayReceipt({
    degradedReplayResult: degradedReplayResult,
    handoffConsistency,
  });
  const repairRouting = routeRepairActions({
    degradedReplayReceipt,
    feedbackRouting,
  });
  const recoveryPreview = previewTeamRecovery({
    degradedReplayReceipt,
    repairRouting,
    feedbackRouting,
  });
  const teamLoopBridge = buildTeamLoopBridge({
    selfBuildResult: options.selfBuildPreview ?? buildSelfBuildPreview(goal, agentPlan, executionBundles),
    teamReceipt,
    loopPreview,
    teamResult: {
      agent_plan: agentPlan,
      feedback_routing: feedbackRouting,
      recovery_preview: recoveryPreview,
    },
  });
  const result: AgentTeamExecutionResult = {
    goal_summary: goal,
    agent_plan: agentPlan,
    team_plan: teamMerge.team_plan,
    team_result_merge: teamMerge,
    execution_bundles: executionBundles,
    simulation_result: simulationResult,
    team_receipt: teamReceipt,
    feedback_routing: feedbackRouting,
    bundle_validation: bundleValidation,
    handoff_consistency: handoffConsistency,
    replay_result: replayResult,
    replay_receipt: replayReceipt,
    loop_preview: loopPreview,
    failure_scenario_profile: failureScenarioProfile,
    degraded_replay_result: degradedReplayResult,
    degraded_replay_receipt: degradedReplayReceipt,
    repair_routing: repairRouting,
    recovery_preview: recoveryPreview,
    team_loop_bridge: teamLoopBridge,
    next_step: "",
  };
  result.next_step = buildNextStep(result);

  return result;
}

async function main() {
  const parsedArgs = parseArgs(process.argv.slice(2));
  const result = runAgentTeamFlow(parsedArgs.goal, {
    failureScenarioId: parsedArgs.failureScenarioId,
  });

  console.log("=== AGENT PLAN ===");
  console.log(JSON.stringify(result.agent_plan, null, 2));
  console.log("");
  console.log("=== AGENT ASSIGNMENT ===");
  console.log(JSON.stringify(result.team_plan.assignment, null, 2));
  console.log("");
  console.log("=== SUB AGENT TEMPLATES ===");
  console.log(JSON.stringify(result.team_plan.sub_agent_templates, null, 2));
  console.log("");
  console.log("=== COORDINATION PLAN ===");
  console.log(JSON.stringify(result.team_plan.coordination_plan, null, 2));
  console.log("");
  console.log("=== TEAM RESULT MERGE ===");
  console.log(JSON.stringify(result.team_result_merge, null, 2));
  console.log("");
  console.log("=== AGENT EXECUTION BUNDLES ===");
  console.log(JSON.stringify(result.execution_bundles, null, 2));
  console.log("");
  console.log("=== TEAM EXECUTION SIMULATION ===");
  console.log(JSON.stringify(result.simulation_result, null, 2));
  console.log("");
  console.log("=== TEAM EXECUTION RECEIPT ===");
  console.log(JSON.stringify(result.team_receipt, null, 2));
  console.log("");
  console.log("=== AGENT FEEDBACK ROUTING ===");
  console.log(JSON.stringify(result.feedback_routing, null, 2));
  console.log("");
  console.log("=== TEAM BUNDLE VALIDATION ===");
  console.log(JSON.stringify(result.bundle_validation, null, 2));
  console.log("");
  console.log("=== HANDOFF CONSISTENCY CHECK ===");
  console.log(JSON.stringify(result.handoff_consistency, null, 2));
  console.log("");
  console.log("=== TEAM REPLAY RESULT ===");
  console.log(JSON.stringify(result.replay_result, null, 2));
  console.log("");
  console.log("=== TEAM REPLAY RECEIPT ===");
  console.log(JSON.stringify(result.replay_receipt, null, 2));
  console.log("");
  console.log("=== AGENT LOOP PREVIEW ===");
  console.log(JSON.stringify(result.loop_preview, null, 2));
  console.log("");
  if (result.failure_scenario_profile) {
    console.log("=== FAILURE SCENARIO PROFILE ===");
    console.log(JSON.stringify(result.failure_scenario_profile, null, 2));
    console.log("");
  }
  console.log("=== DEGRADED REPLAY RESULT ===");
  console.log(JSON.stringify(result.degraded_replay_result, null, 2));
  console.log("");
  console.log("=== DEGRADED REPLAY RECEIPT ===");
  console.log(JSON.stringify(result.degraded_replay_receipt, null, 2));
  console.log("");
  console.log("=== REPAIR ROUTING ===");
  console.log(JSON.stringify(result.repair_routing, null, 2));
  console.log("");
  console.log("=== TEAM RECOVERY PREVIEW ===");
  console.log(JSON.stringify(result.recovery_preview, null, 2));
  console.log("");
  console.log("=== TEAM LOOP BRIDGE ===");
  console.log(JSON.stringify(result.team_loop_bridge, null, 2));
  console.log("");
  console.log("=== TEAM EXECUTION RESULT ===");
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
