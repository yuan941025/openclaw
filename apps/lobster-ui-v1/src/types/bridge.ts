export type BridgeMode = "bridge" | "mock";

export type ActionStage = "received" | "running" | "success" | "error";

export type UsageMode = "local" | "model";

export type CodexAnchorState = {
  ready: boolean;
  x: number | null;
  y: number | null;
  capturedAt: string | null;
};

export type BridgeState = {
  lastCommand: Record<string, unknown> | null;
  lastResult: Record<string, unknown> | null;
  updatedAt: string | null;
  lastProjectPath?: string | null;
  codexAnchor: CodexAnchorState;
};

export type BridgeCheck = {
  ok: boolean;
  mode: BridgeMode;
  baseUrl: string;
  latencyMs: number | null;
  checkedAt: string;
  error?: string;
  state?: BridgeState;
};

export type ShortcutId =
  | "open_vscode"
  | "open_project"
  | "new_terminal"
  | "run_npm_start"
  | "open_package_json";

export type SendActionInput = {
  label: string;
  description: string;
  target: string;
  params: Record<string, string>;
  usage: UsageMode;
};

export type CodexPasteInput = {
  text: string;
  autoSubmit: boolean;
  readBack?: boolean;
  waitForReply?: boolean;
  replyDelayMs?: number;
  projectPath?: string;
};

export type CodexReadInput = {
  delayMs?: number;
  projectPath?: string;
};

export type BridgeActionResponse = {
  ok: boolean;
  source: BridgeMode;
  did: string;
  label: string;
  summary: string;
  target: string;
  usage: UsageMode;
  durationMs: number;
  payload: Record<string, unknown> | null;
  state?: BridgeState;
  error?: string;
  fallbackReason?: string;
};

export type ShortcutDefinition = SendActionInput & {
  id: ShortcutId;
};
