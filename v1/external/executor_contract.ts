import type {
  AgentExecutionBundleExport,
  ExecutorContract,
  TeamMergeResult,
} from "../agents/agent_types.ts";

type BuildExecutorContractInput = {
  executionBundles: AgentExecutionBundleExport;
  teamPlan: TeamMergeResult["team_plan"];
};

function getExecutionMode(
  role: ExecutorContract["executable_agents"][number]["role"],
): ExecutorContract["executable_agents"][number]["allowed_execution_mode"] {
  if (role === "operator") {
    return "approval_required";
  }

  return "internal_only";
}

const REQUIRED_RECEIPT_FIELDS = [
  "agent_id",
  "status",
  "action_summary",
  "produced_artifacts",
  "safety_notes",
];

export function buildExecutorContract(
  input: BuildExecutorContractInput,
): ExecutorContract {
  const executableAgents = input.executionBundles.bundles.map((bundle) => ({
    agent_id: bundle.agent_id,
    role: bundle.role,
    allowed_execution_mode: getExecutionMode(bundle.role),
    executable_bundle_summary: [
      `Assigned tasks: ${bundle.assigned_tasks.map((task) => task.task_id).join(", ") || "none"}.`,
      `Required inputs: ${bundle.required_inputs.join(", ") || "none"}.`,
      `Expected outputs: ${bundle.expected_outputs.join(", ") || "none"}.`,
    ],
    required_receipt_fields: REQUIRED_RECEIPT_FIELDS,
  }));

  return {
    executable_agents: executableAgents,
    team_executor_contract: {
      contract_version: "v5-m1",
      accepted_roles: input.teamPlan.required_agents.map((agent) => agent.role),
      required_bundle_fields: [
        "agent_id",
        "role",
        "assigned_tasks",
        "required_inputs",
        "expected_outputs",
      ],
      receipt_schema_ref: "v1/external/executor_receipt.ts#ExternalExecutorReceipt",
    },
    contract_summary: executableAgents.map((agent) =>
      `${agent.agent_id} (${agent.role}) is ${agent.allowed_execution_mode} under the current executor contract.`
    ),
  };
}
