import { parseAuthorizedPlan } from "./authorization_parser.ts";
import { executeTasks, type TaskRunner } from "./executor.ts";
import { formatProposal } from "./proposal_formatter.ts";
import {
  generateExecutionReport,
  type ExecutionReport,
} from "./report_generator.ts";
import { dispatchTasks } from "./task_dispatcher.ts";
import { buildTeam } from "./team_manager.ts";
import { loadLobsterBrain } from "./lobster_brain.ts";
import type {
  AuthorizedPlan,
  ProposalOutput,
  SearchCandidate,
  SearchInput,
  SearchProvider,
  TaskExecutionResult,
  TeamMember,
} from "./types.ts";

export type ProposalStageResult = {
  searchInput: SearchInput;
  candidates: SearchCandidate[];
  proposals: ProposalOutput[];
};

export type ExecutionStageResult = {
  plan: AuthorizedPlan;
  team: TeamMember[];
  results: TaskExecutionResult[];
  report: ExecutionReport;
};

export type MainFlowResult = {
  proposalStage: ProposalStageResult;
  executionStage: ExecutionStageResult;
};

function filterLowValueCandidates(candidates: SearchCandidate[]): SearchCandidate[] {
  // V1 filtering is mechanical only. Candidates marked as low value upstream are excluded.
  return candidates.filter((candidate) => candidate.lowValue !== true);
}

export async function runProposalStage(params: {
  input: SearchInput;
  search: SearchProvider;
}): Promise<ProposalStageResult> {
  const brain = loadLobsterBrain();
  const query = params.input.query.trim();
  const marketScope = params.input.marketScope?.trim() ?? null;

  if (brain.authorizationRules.searchRequiresExplicitInput && !query && !marketScope) {
    throw new Error("search input requires a query or marketScope");
  }

  const candidates = await params.search({
    query,
    marketScope,
  });
  const filteredCandidates = filterLowValueCandidates(candidates);
  const proposals = filteredCandidates.map((candidate) =>
    formatProposal({
      projectName: candidate.projectName,
      summary: candidate.summary,
      feasibility: candidate.feasibility,
      returnLevel: candidate.returnLevel,
      reason: candidate.reason,
    }),
  );

  return {
    searchInput: { query, marketScope },
    candidates: filteredCandidates,
    proposals,
  };
}

export async function runExecutionStage(params: {
  authorizedInput: unknown;
  runTask: TaskRunner;
}): Promise<ExecutionStageResult> {
  loadLobsterBrain();
  const plan = parseAuthorizedPlan(params.authorizedInput);
  const team = buildTeam(plan);
  const queue = dispatchTasks(plan);
  const results = await executeTasks(queue, params.runTask);
  const report = generateExecutionReport({ plan, team, results });

  return {
    plan,
    team,
    results,
    report,
  };
}

export async function runV1MainFlow(params: {
  input: SearchInput;
  search: SearchProvider;
  authorizedInput: unknown;
  runTask: TaskRunner;
}): Promise<MainFlowResult> {
  const proposalStage = await runProposalStage({
    input: params.input,
    search: params.search,
  });
  const executionStage = await runExecutionStage({
    authorizedInput: params.authorizedInput,
    runTask: params.runTask,
  });

  return {
    proposalStage,
    executionStage,
  };
}
