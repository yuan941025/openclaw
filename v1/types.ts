export type ProposalRating = "high" | "medium" | "low";

export type ProposalCandidate = {
  projectName: string;
  summary: string;
  feasibility: ProposalRating;
  returnLevel: ProposalRating;
  reason: string;
  lowValue?: boolean;
};

export type SearchInput = {
  query: string;
  marketScope?: string | null;
};

export type SearchCandidate = ProposalCandidate;

export type ProposalOutput = {
  project_name: string;
  summary: string;
  feasibility: ProposalRating;
  return_level: ProposalRating;
  reason: string;
};

export type AuthorizedAgent = {
  role: string;
  responsibility: string;
};

export type AuthorizedTask = {
  description: string;
  assigned_agent: string;
};

export type AuthorizedPlan = {
  project_name: string;
  agents: AuthorizedAgent[];
  tasks: AuthorizedTask[];
  goal: string;
};

export type TeamMember = {
  role: string;
  responsibility: string;
};

export type TaskStatus = "pending" | "in_progress" | "done" | "failed" | "blocked";

export type TaskRecord = {
  description: string;
  assignedAgent: string;
  status: TaskStatus;
  result: string | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export type TaskExecutionInput = {
  description: string;
  assignedAgent: string;
};

export type TaskExecutionStatus = "success" | "failed";

export type TaskExecutionResult = {
  description: string;
  assignedAgent: string;
  status: TaskExecutionStatus;
  content: string | null;
  error: string | null;
  startedAt: string;
  finishedAt: string;
};

export type SearchProvider = (input: SearchInput) => Promise<SearchCandidate[]>;
