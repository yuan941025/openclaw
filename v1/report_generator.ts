import type { AuthorizedPlan, ProposalOutput, TaskExecutionResult, TeamMember } from "./types.ts";

export type ExecutionReport = {
  project_name: string;
  goal: string;
  team: TeamMember[];
  tasks: TaskExecutionResult[];
};

export function generateProposalReport(proposal: ProposalOutput): ProposalOutput {
  return proposal;
}

export function generateExecutionReport(params: {
  plan: AuthorizedPlan;
  team: TeamMember[];
  results: TaskExecutionResult[];
}): ExecutionReport {
  return {
    project_name: params.plan.project_name,
    goal: params.plan.goal,
    team: params.team,
    tasks: params.results,
  };
}
