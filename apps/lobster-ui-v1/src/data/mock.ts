import type { BridgeActionResponse, BridgeCheck, SendActionInput } from "../types/bridge";
import type {
  CodexReplyState,
  DashboardMetrics,
  ExecutionResultState,
  LearningStatus,
  StatusOverview,
  TaskCardState,
  TimelineEvent,
} from "../types/dashboard";

const now = () => new Date().toISOString();

export const initialStatusOverview: StatusOverview = {
  lobster: "Online",
  bridge: "Mock",
  model: "Idle",
  currentTarget: "VS Code / OpenClaw",
};

export const initialTimeline: TimelineEvent[] = [
  {
    id: "evt-bootstrap",
    title: "控制台已啟動",
    detail: "Lobster UI 已載入，目前正在等待 bridge 連線。",
    stage: "success",
    timestamp: now(),
    source: "mock",
    target: "龍蝦科技控制台",
  },
  {
    id: "evt-health",
    title: "Bridge 健康檢查",
    detail: "會持續輪詢 `/health`，一旦 bridge 上線就切回真實模式。",
    stage: "running",
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    source: "mock",
    target: "Bridge",
  },
  {
    id: "evt-learning",
    title: "Learning 區已載入",
    detail: "目前以 placeholder 顯示，預留後續優化與建議資訊。",
    stage: "received",
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    source: "mock",
    target: "Learning 區",
  },
];

export const initialMetrics: DashboardMetrics = {
  todayCommands: 28,
  successRate: 96,
  avgResponseMs: 540,
  localExecutionRatio: 68,
  modelUsageRatio: 32,
  tokenCostLabel: "13.2k / $0.42",
  successCount: 27,
  localCount: 19,
  modelCount: 9,
  latencyTotalMs: 15120,
  trend: [
    { label: "09:00", commands: 3, latency: 620, model: 1 },
    { label: "11:00", commands: 5, latency: 560, model: 2 },
    { label: "13:00", commands: 4, latency: 540, model: 1 },
    { label: "15:00", commands: 6, latency: 490, model: 2 },
    { label: "17:00", commands: 4, latency: 510, model: 1 },
    { label: "現在", commands: 6, latency: 530, model: 2 },
  ],
};

export const initialLearningStatus: LearningStatus = {
  status: "目前先保留 placeholder，之後可接入真實學習策略與失敗歸因。",
  recentOptimizations: [
    "已加入 bridge 健康檢查與自動切換模式。",
    "已支援區網開啟 UI，讓手機端也能使用控制台。",
    "Activity 與 Execution Result 會優先顯示 bridge 的真實結果。",
  ],
  lastFailure: "上一個已知問題是 bridge 離線時，桌面與手機端都只能回到模擬模式。",
  nextSuggestion: "下一步可補強更穩定的聊天框定位方式，但不在這一包處理。",
};

export const initialTaskState: TaskCardState = {
  title: "等待 bridge 上線",
  status: "received",
  summary: "控制台已啟動，正在等待真實 bridge 連線。",
  source: "mock",
  target: "VS Code / OpenClaw",
  updatedAt: now(),
};

export const initialExecutionResult: ExecutionResultState = {
  title: "等待執行",
  body: "選擇快捷動作、輸入指令，或使用 Codex 貼上流程後，結果會顯示在這裡。",
  status: "received",
  source: "mock",
  raw: JSON.stringify(
    {
      ok: true,
      note: "模擬模式待命中",
      bridge: "pending",
    },
    null,
    2,
  ),
  updatedAt: now(),
};

export const initialCodexReplyState: CodexReplyState = {
  title: "Codex 最新回覆",
  stateLabel: "待命",
  summary: "送出到 Codex 後，最新摘要戰報會固定顯示在這裡。",
  report: [
    "【已完成】",
    "- 尚未收到新的 Codex 回覆",
    "",
    "【目前狀態】",
    "- 等待新的摘要戰報",
    "",
    "【失敗/卡點】",
    "- 無",
    "",
    "【下一步】",
    "- 送出內容到 Codex，或按「立即讀取最新 Codex 回覆」",
    "",
    "【我現在需不需要操作】",
    "- 不需要",
  ].join("\n"),
  status: "received",
  source: "mock",
  updatedAt: now(),
};

export function createMockBridgeCheck(error?: string): BridgeCheck {
  return {
    ok: false,
    mode: "mock",
    baseUrl: "http://127.0.0.1:8787",
    latencyMs: null,
    checkedAt: now(),
    error: error || "bridge 目前不可用，已切換為模擬模式。",
    state: {
      lastCommand: null,
      lastResult: null,
      updatedAt: now(),
      codexAnchor: {
        ready: false,
        x: null,
        y: null,
        capturedAt: null,
      },
    },
  };
}

function buildMockSummary(input: SendActionInput) {
  switch (input.params.c) {
    case "ov":
      return "模擬模式：已打開 VS Code。";
    case "op":
      return "模擬模式：已打開 OpenClaw 專案。";
    case "nt":
      return "模擬模式：已新增終端機。";
    case "rt":
      return `模擬模式：已執行終端機命令 ${input.params.command || ""}`;
    case "of":
      return `模擬模式：已開啟檔案 ${input.params.filePath || "package.json"}`;
    case "tt":
      return `模擬模式：已輸入文字 ${input.params.text || ""}`;
    default:
      return `${input.label} 已在模擬模式中完成。`;
  }
}

export function createMockActionResponse(
  input: SendActionInput,
  fallbackReason: string,
): BridgeActionResponse {
  const durationMs = 320 + Math.round(Math.random() * 260);

  return {
    ok: true,
    source: "mock",
    did: input.params.c || "mock_action",
    label: input.label,
    summary: buildMockSummary(input),
    target: input.target,
    usage: input.usage,
    durationMs,
    payload: {
      ok: true,
      did: input.params.c || "mock_action",
      simulated: true,
      params: input.params,
    },
    fallbackReason,
  };
}
