import type { BridgeActionResponse, BridgeCheck, ShortcutDefinition } from "./bridge";

export type StatusOverview = {
  lobster: "Online" | "Offline";
  bridge: "Connected" | "Mock";
  model: "Connected" | "Idle" | "Thinking";
  currentTarget: string;
};

export type TimelineEvent = {
  id: string;
  title: string;
  detail: string;
  stage: "received" | "running" | "success" | "error";
  timestamp: string;
  source: "bridge" | "mock";
  target: string;
};

export type MetricTrendPoint = {
  label: string;
  commands: number;
  latency: number;
  model: number;
};

export type DashboardMetrics = {
  todayCommands: number;
  successRate: number;
  avgResponseMs: number;
  localExecutionRatio: number;
  modelUsageRatio: number;
  tokenCostLabel: string;
  trend: MetricTrendPoint[];
  successCount: number;
  localCount: number;
  modelCount: number;
  latencyTotalMs: number;
};

export type LearningStatus = {
  status: string;
  recentOptimizations: string[];
  lastFailure: string;
  nextSuggestion: string;
};

export type TaskCardState = {
  title: string;
  status: "received" | "running" | "success" | "error";
  summary: string;
  source: "bridge" | "mock";
  target: string;
  updatedAt: string;
};

export type ExecutionResultState = {
  title: string;
  body: string;
  status: "received" | "running" | "success" | "error";
  source: "bridge" | "mock";
  raw: string;
  updatedAt: string;
};

export type CodexReplyState = {
  title: string;
  stateLabel: string;
  summary: string;
  report: string;
  status: "received" | "running" | "success" | "error";
  source: "bridge" | "mock";
  updatedAt: string;
};

export type MobileTab = "control" | "activity" | "metrics" | "learn";

export type DashboardState = {
  health: BridgeCheck;
  statusOverview: StatusOverview;
  shortcuts: ShortcutDefinition[];
  timeline: TimelineEvent[];
  metrics: DashboardMetrics;
  learning: LearningStatus;
  currentTask: TaskCardState;
  executionResult: ExecutionResultState;
  codexReply: CodexReplyState;
  commandInput: string;
  codexPrompt: string;
  codexAutoSubmit: boolean;
  codexReadBack: boolean;
  codexAnchorReady: boolean;
  activeTab: MobileTab;
  isSending: boolean;
  mockBannerVisible: boolean;
  setCommandInput: (value: string) => void;
  setCodexPrompt: (value: string) => void;
  setCodexAutoSubmit: (value: boolean) => void;
  setCodexReadBack: (value: boolean) => void;
  submitCommand: () => Promise<void>;
  submitCodexPaste: () => Promise<void>;
  readCodexReplyNow: () => Promise<void>;
  captureCodexAnchor: () => Promise<void>;
  runShortcutAction: (id: ShortcutDefinition["id"]) => Promise<void>;
  refreshHealth: () => Promise<void>;
  setActiveTab: (tab: MobileTab) => void;
};

export type ActionSessionConfig = {
  input: {
    label: string;
    detail: string;
    target: string;
    usage: BridgeActionResponse["usage"];
  };
  run: () => Promise<BridgeActionResponse>;
  stages?: {
    acceptedDetail?: string;
    acceptedBody?: string;
    runningDetail?: string;
    runningBody?: string;
  };
  codexReplyStages?: {
    accepted?: {
      stateLabel: string;
      summary: string;
      report: string;
      status: TaskCardState["status"];
    };
    running?: {
      stateLabel: string;
      summary: string;
      report: string;
      status: TaskCardState["status"];
    };
  };
};
