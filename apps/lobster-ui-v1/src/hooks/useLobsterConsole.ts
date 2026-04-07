import { startTransition, useEffect, useRef, useState } from "react";
import { copy, formatBridgeValue, formatStageValue, shortcutCopy } from "../app/copy";
import {
  initialCodexReplyState,
  initialExecutionResult,
  initialLearningStatus,
  initialMetrics,
  initialStatusOverview,
  initialTaskState,
  initialTimeline,
} from "../data/mock";
import {
  captureCodexAnchor,
  checkHealth,
  configuredBridgeBaseUrl,
  pasteToCodex,
  readCodexReply,
  resolveCommandInput,
  runShortcut,
  shortcuts,
  sendAction,
} from "../services/bridge";
import type { BridgeActionResponse, BridgeCheck, BridgeState, ShortcutId } from "../types/bridge";
import type {
  ActionSessionConfig,
  CodexReplyState,
  DashboardMetrics,
  DashboardState,
  ExecutionResultState,
  MobileTab,
  TaskCardState,
  TimelineEvent,
} from "../types/dashboard";

const healthPollMs = 15000;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function formatClock(isoTime: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoTime));
}

function previewText(value: string, max = 72) {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max)}…`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function makeEvent(config: {
  title: string;
  detail: string;
  stage: TimelineEvent["stage"];
  target: string;
  source: TimelineEvent["source"];
  timestamp?: string;
}) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: config.title,
    detail: config.detail,
    stage: config.stage,
    timestamp: config.timestamp || new Date().toISOString(),
    source: config.source,
    target: config.target,
  } satisfies TimelineEvent;
}

function updateTrend(
  currentTrend: DashboardMetrics["trend"],
  result: BridgeActionResponse,
): DashboardMetrics["trend"] {
  const nextTrend = currentTrend.slice();
  const latestPoint = nextTrend[nextTrend.length - 1];

  if (!latestPoint) {
    return currentTrend;
  }

  nextTrend[nextTrend.length - 1] = {
    ...latestPoint,
    commands: latestPoint.commands + 1,
    latency: Math.round((latestPoint.latency + result.durationMs) / 2),
    model: latestPoint.model + (result.usage === "model" ? 1 : 0),
  };

  return nextTrend;
}

function evolveMetrics(current: DashboardMetrics, result: BridgeActionResponse): DashboardMetrics {
  const total = current.todayCommands + 1;
  const successCount = current.successCount + (result.ok ? 1 : 0);
  const localCount = current.localCount + (result.usage === "local" ? 1 : 0);
  const modelCount = current.modelCount + (result.usage === "model" ? 1 : 0);
  const latencyTotalMs = current.latencyTotalMs + result.durationMs;

  return {
    ...current,
    todayCommands: total,
    successCount,
    localCount,
    modelCount,
    latencyTotalMs,
    successRate: Math.round((successCount / total) * 100),
    avgResponseMs: Math.round(latencyTotalMs / total),
    localExecutionRatio: Math.round((localCount / total) * 100),
    modelUsageRatio: Math.round((modelCount / total) * 100),
    tokenCostLabel: `${(total * 470).toLocaleString()} / $${(total * 0.018).toFixed(2)}`,
    trend: updateTrend(current.trend, result),
  };
}

function normalizeDid(did?: string | null) {
  switch (did) {
    case "ca":
      return "capture_codex_anchor";
    case "pc":
      return "paste_to_codex";
    case "rc":
      return "read_codex_reply";
    default:
      return did || "";
  }
}

function isCodexDid(did?: string | null) {
  const normalized = normalizeDid(did);
  return (
    normalized === "capture_codex_anchor" ||
    normalized === "paste_to_codex" ||
    normalized === "read_codex_reply"
  );
}

function resolveBridgeTarget(state: BridgeState) {
  const lastResult = asRecord(state.lastResult);
  const lastCommand = asRecord(state.lastCommand);
  const did = normalizeDid(typeof lastResult?.did === "string" ? lastResult.did : undefined);

  if (did === "paste_to_codex" || did === "capture_codex_anchor" || did === "read_codex_reply") {
    return "Codex 聊天框";
  }
  if (typeof lastResult?.filePath === "string") {
    return lastResult.filePath;
  }
  if (typeof lastResult?.command === "string") {
    return "OpenClaw 終端機";
  }
  if (typeof lastResult?.projectPath === "string") {
    return "OpenClaw";
  }
  if (typeof lastResult?.text === "string") {
    return "VS Code";
  }
  if (typeof lastCommand?.filePath === "string") {
    return String(lastCommand.filePath);
  }
  if (typeof lastCommand?.command === "string") {
    return "OpenClaw 終端機";
  }
  if (typeof lastCommand?.projectPath === "string") {
    return "OpenClaw";
  }

  return "VS Code";
}

function resolveBridgeActionLabel(state: BridgeState) {
  const lastResult = asRecord(state.lastResult);
  const lastCommand = asRecord(state.lastCommand);
  const did = normalizeDid(
    typeof lastResult?.did === "string" ? lastResult.did : typeof lastCommand?.type === "string" ? lastCommand.type : "",
  );

  switch (did) {
    case "open_vscode":
      return shortcutCopy.open_vscode.label;
    case "open_project":
      return shortcutCopy.open_project.label;
    case "new_terminal":
      return shortcutCopy.new_terminal.label;
    case "run_terminal":
      return "執行終端機命令";
    case "open_file":
      return "開啟檔案";
    case "type_text":
      return "輸入文字";
    case "command_palette":
      return "執行 VS Code 指令";
    case "workflow_openclaw_dev":
      return "啟動 OpenClaw 開發流程";
    case "capture_codex_anchor":
      return copy.codex.capture;
    case "paste_to_codex":
      return copy.codex.send;
    case "read_codex_reply":
      return copy.codex.readNow;
    case "health":
      return "Bridge 健康檢查";
    default:
      return "Bridge 動作";
  }
}

type ActionPresentation = {
  summary: string;
  report: string;
};

function createCodexReplyState(config: {
  stateLabel: string;
  summary: string;
  report: string;
  status: CodexReplyState["status"];
  source: CodexReplyState["source"];
  updatedAt?: string;
}) {
  return {
    title: copy.codex.latestReplyTitle,
    stateLabel: config.stateLabel,
    summary: config.summary,
    report: config.report,
    status: config.status,
    source: config.source,
    updatedAt: config.updatedAt || new Date().toISOString(),
  } satisfies CodexReplyState;
}

function buildDisconnectedCodexReplyReport(message: string) {
  return [
    "【已完成】",
    "- 已送出給 Codex",
    "",
    "【目前狀態】",
    "- 等待回覆或讀取失敗",
    "",
    "【失敗/卡點】",
    `- ${message}`,
    "",
    "【下一步】",
    "- 請確認 bridge 已啟動後再重試一次",
    "",
    "【我現在需不需要操作】",
    "- 需要",
  ].join("\n");
}

function buildCodexReplyStateFromOutcome(config: {
  did?: string;
  payload?: Record<string, unknown> | null;
  summary: string;
  ok: boolean;
  source: CodexReplyState["source"];
  updatedAt?: string;
}) {
  const did = normalizeDid(config.did);
  const payload = config.payload || null;
  const replySummary =
    typeof payload?.replySummary === "string" && payload.replySummary.trim() ? payload.replySummary : "";
  const replyStatus =
    typeof payload?.replyStatus === "string" && payload.replyStatus.trim() ? payload.replyStatus : "";

  if (did !== "paste_to_codex" && did !== "read_codex_reply") {
    return null;
  }

  if (replySummary) {
    return createCodexReplyState({
      stateLabel: config.ok ? copy.codex.replyReceived : copy.codex.replyFailed,
      summary: replyStatus || config.summary,
      report: replySummary,
      status: config.ok ? "success" : "error",
      source: config.source,
      updatedAt: config.updatedAt,
    });
  }

  if (!config.ok) {
    return createCodexReplyState({
      stateLabel: copy.codex.replyFailed,
      summary: config.summary,
      report: buildDisconnectedCodexReplyReport(config.summary),
      status: "error",
      source: config.source,
      updatedAt: config.updatedAt,
    });
  }

  return null;
}

function buildCodexFailureReport(message: string) {
  return [
    "【已完成】",
    "- 已切到 VS Code",
    "- 已開啟 Codex 側邊欄",
    "",
    "【目前狀態】",
    "- 未能聚焦 Codex 聊天框",
    "",
    "【失敗/卡點】",
    "- 尚未校準輸入框位置",
    `- ${message}`,
    "",
    "【下一步】",
    "- 請先按「記住 Codex 輸入框位置」",
    "",
    "【我現在需不需要操作】",
    "- 需要",
  ].join("\n");
}

function buildCodexActionPresentation(
  did: string,
  payload: Record<string, unknown> | null,
  fallbackSummary: string,
  ok: boolean,
): ActionPresentation {
  const message =
    typeof payload?.message === "string" && payload.message.trim() ? payload.message : fallbackSummary;
  const replySummary =
    typeof payload?.replySummary === "string" && payload.replySummary.trim() ? payload.replySummary : "";
  const replyStatus =
    typeof payload?.replyStatus === "string" && payload.replyStatus.trim() ? payload.replyStatus : "";

  if ((did === "paste_to_codex" || did === "read_codex_reply") && replySummary) {
    return {
      summary: replyStatus || message || copy.codex.summaryReady,
      report: replySummary,
    };
  }

  if (did === "capture_codex_anchor") {
    if (!ok) {
      return {
        summary: message || "尚未完成 Codex 校準",
        report: [
          "【已完成】",
          "- 無",
          "",
          "【目前狀態】",
          "- 尚未完成 Codex 輸入框校準",
          "",
          "【失敗/卡點】",
          `- ${message || "bridge 尚未完成校準流程"}`,
          "",
          "【下一步】",
          "- 重新按一次「記住 Codex 輸入框位置」，並把滑鼠移到聊天框",
          "",
          "【我現在需不需要操作】",
          "- 需要",
        ].join("\n"),
      };
    }

    return {
      summary: "已記住 Codex 輸入框位置",
      report: [
        "【已完成】",
        "- 已記住 Codex 輸入框位置",
        "",
        "【目前狀態】",
        "- 校準完成，之後可直接貼到 Codex",
        "",
        "【失敗/卡點】",
        "- 無",
        "",
        "【下一步】",
        "- 可返回龍蝦面板送出內容",
        "",
        "【我現在需不需要操作】",
        "- 不需要",
      ].join("\n"),
    };
  }

  const submitted = payload?.submitted === true;
  const steps = asRecord(payload?.steps);
  const focusedInput = steps?.focusedCodexInput === true;
  const pasted = steps?.pasted === true;

  if (!ok) {
    if (message.includes("校準") || !focusedInput) {
      return {
        summary: "未能聚焦 Codex 聊天框，請先校準",
        report: buildCodexFailureReport(message || "尚未校準輸入框位置"),
      };
    }

    return {
      summary: message || "貼到 Codex 失敗",
      report: [
        "【已完成】",
        "- 已嘗試切到 VS Code",
        "- 已嘗試開啟 Codex 側邊欄",
        "",
        "【目前狀態】",
        `- ${message || "貼到 Codex 失敗"}`,
        "",
        "【失敗/卡點】",
        `- ${message || "bridge 尚未完成貼上流程"}`,
        "",
        "【下一步】",
        "- 請先確認 bridge 已啟動，再重試一次",
        "",
        "【我現在需不需要操作】",
        "- 需要",
      ].join("\n"),
    };
  }

  return {
    summary: submitted ? "已貼上並送出" : "已貼上，尚未送出",
    report: [
      "【已完成】",
      `- 已切到 VS Code`,
      `- 已開啟 Codex 側邊欄${focusedInput ? "" : "（待確認聊天框焦點）"}`,
      ...(pasted ? ["- 已貼上內容"] : []),
      "",
      "【目前狀態】",
      `- ${submitted ? "等待 Codex 回覆" : "已貼上，尚未送出"}`,
      "",
      "【失敗/卡點】",
      "- 無",
      "",
      "【下一步】",
      `- ${submitted ? "可等待 Codex 完成施工" : "可在 VS Code 裡確認內容後手動送出"}`,
      "",
      "【我現在需不需要操作】",
      "- 不需要",
    ].join("\n"),
  };
}

function buildActionPresentation(result: {
  did?: string;
  payload?: Record<string, unknown> | null;
  summary: string;
  ok: boolean;
}) {
  const did = normalizeDid(result.did);

  if (!isCodexDid(did)) {
    return {
      summary: result.summary,
      report: result.payload ? JSON.stringify(result.payload, null, 2) : result.summary,
    } satisfies ActionPresentation;
  }

  return buildCodexActionPresentation(did, result.payload || null, result.summary, result.ok);
}

function buildHydratedState(state: BridgeState): {
  signature: string;
  target: string;
  task: TaskCardState;
  result: ExecutionResultState;
  codexReply: CodexReplyState;
  event: TimelineEvent;
} | null {
  const lastResult = asRecord(state.lastResult);

  if (!lastResult) {
    return null;
  }

  const updatedAt = state.updatedAt || new Date().toISOString();
  const did = typeof lastResult.did === "string" ? lastResult.did : "";
  const label = resolveBridgeActionLabel(state);
  const target = resolveBridgeTarget(state);
  const ok = lastResult.ok !== false;
  const status: TaskCardState["status"] = ok ? "success" : "error";
  const fallbackSummary =
    typeof lastResult.message === "string"
      ? lastResult.message
      : typeof lastResult.error === "string"
        ? lastResult.error
        : `${label} 已由 bridge 完成。`;
  const presentation = buildActionPresentation({
    did,
    payload: lastResult,
    summary: fallbackSummary,
    ok,
  });
  const signature = JSON.stringify({
    updatedAt,
    did,
    ok,
    message: lastResult.message,
    error: lastResult.error,
    submitted: lastResult.submitted,
    replyStatus: lastResult.replyStatus,
    replyExcerpt: lastResult.replyExcerpt,
    replySummary: lastResult.replySummary,
  });

  return {
    signature,
    target,
    task: {
      title: label,
      status,
      summary: presentation.summary,
      source: "bridge",
      target,
      updatedAt,
    },
    result: {
      title: status === "success" ? copy.execution.successTitle : copy.execution.errorTitle,
      body: presentation.summary,
      status,
      source: "bridge",
      raw: presentation.report,
      updatedAt,
    },
    codexReply:
      buildCodexReplyStateFromOutcome({
        did,
        payload: lastResult,
        summary: presentation.summary,
        ok,
        source: "bridge",
        updatedAt,
      }) || initialCodexReplyState,
    event: makeEvent({
      title: `${label}：${formatStageValue(status)}`,
      detail: presentation.summary,
      stage: status,
      target,
      source: "bridge",
      timestamp: updatedAt,
    }),
  };
}

export function useLobsterConsole(): DashboardState {
  const [health, setHealth] = useState<BridgeCheck>(() => ({
    ok: false,
    mode: "mock",
    baseUrl: configuredBridgeBaseUrl,
    latencyMs: null,
    checkedAt: new Date().toISOString(),
    error: "正在等待 bridge 健康檢查。",
  }));
  const [statusOverview, setStatusOverview] = useState(initialStatusOverview);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [learning] = useState(initialLearningStatus);
  const [currentTask, setCurrentTask] = useState(initialTaskState);
  const [executionResult, setExecutionResult] = useState(initialExecutionResult);
  const [codexReply, setCodexReply] = useState(initialCodexReplyState);
  const [commandInput, setCommandInput] = useState("");
  const [codexPrompt, setCodexPrompt] = useState("");
  const [codexAutoSubmit, setCodexAutoSubmit] = useState(false);
  const [codexReadBack, setCodexReadBack] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("control");
  const [isSending, setIsSending] = useState(false);
  const [mockBannerVisible, setMockBannerVisible] = useState(true);
  const hydratedBridgeSignatureRef = useRef<string | null>(null);

  function updateCodexAutoSubmit(value: boolean) {
    setCodexAutoSubmit(value);
    if (!value) {
      setCodexReadBack(false);
    }
  }

  function pushEvent(event: TimelineEvent) {
    startTransition(() => {
      setTimeline((currentEvents) => [event, ...currentEvents].slice(0, 12));
    });
  }

  async function refreshHealth() {
    const nextHealth = await checkHealth();
    const hydrated = nextHealth.ok && nextHealth.state ? buildHydratedState(nextHealth.state) : null;

    startTransition(() => {
      setHealth(nextHealth);
      setMockBannerVisible(nextHealth.mode === "mock");
      setStatusOverview((current) => ({
        ...current,
        bridge: nextHealth.ok ? "Connected" : "Mock",
        currentTarget: hydrated?.target || current.currentTarget,
      }));

      if (hydrated && hydrated.signature !== hydratedBridgeSignatureRef.current) {
        hydratedBridgeSignatureRef.current = hydrated.signature;
        setCurrentTask(hydrated.task);
        setExecutionResult(hydrated.result);
        setCodexReply(hydrated.codexReply);
        setTimeline((currentEvents) => [hydrated.event, ...currentEvents].slice(0, 12));
      }
    });
  }

  async function performAction(config: ActionSessionConfig) {
    if (isSending) {
      return;
    }

    setIsSending(true);
    const acceptedDetail = config.stages?.acceptedDetail || `已收到請求：${previewText(config.input.detail)}`;
    const acceptedBody = config.stages?.acceptedBody || `已收到要送往 ${config.input.target} 的請求。`;
    const runningDetail = config.stages?.runningDetail || `正在執行 ${config.input.target} 流程`;
    const runningBody = config.stages?.runningBody || `正在執行 ${config.input.target}。`;

    pushEvent(
      makeEvent({
        title: `${config.input.label}：${formatStageValue("received")}`,
        detail: acceptedDetail,
        stage: "received",
        target: config.input.target,
        source: "mock",
      }),
    );

    setCurrentTask({
      title: config.input.label,
      status: "received",
      summary: "已接收請求，準備送往 bridge。",
      source: "mock",
      target: config.input.target,
      updatedAt: new Date().toISOString(),
    });

    setExecutionResult({
      title: copy.execution.acceptedTitle,
      body: acceptedBody,
      status: "received",
      source: "mock",
      raw: JSON.stringify(
        {
          stage: "received",
          target: config.input.target,
        },
        null,
        2,
      ),
      updatedAt: new Date().toISOString(),
    });

    if (config.codexReplyStages?.accepted) {
      setCodexReply(
        createCodexReplyState({
          ...config.codexReplyStages.accepted,
          source: "mock",
        }),
      );
    }

    setStatusOverview((current) => ({
      ...current,
      model: "Thinking",
      currentTarget: config.input.target,
    }));

    const resultPromise = config.run();

    await sleep(180);

    pushEvent(
      makeEvent({
        title: `${config.input.label}：${formatStageValue("running")}`,
        detail: runningDetail,
        stage: "running",
        target: config.input.target,
        source: "mock",
      }),
    );

    setCurrentTask({
      title: config.input.label,
      status: "running",
      summary: "流程執行中，正在等待 bridge 回應。",
      source: "mock",
      target: config.input.target,
      updatedAt: new Date().toISOString(),
    });

    setExecutionResult({
      title: copy.execution.runningTitle,
      body: runningBody,
      status: "running",
      source: "mock",
      raw: JSON.stringify(
        {
          stage: "running",
          target: config.input.target,
        },
        null,
        2,
      ),
      updatedAt: new Date().toISOString(),
    });

    if (config.codexReplyStages?.running) {
      setCodexReply(
        createCodexReplyState({
          ...config.codexReplyStages.running,
          source: "mock",
        }),
      );
    }

    const result = await resultPromise;
    const finalStage = result.ok ? "success" : "error";
    const source = result.source;
    const nowIso = new Date().toISOString();
    const presentation = buildActionPresentation({
      did: result.did,
      payload: result.payload,
      summary: result.error || result.fallbackReason || result.summary,
      ok: result.ok,
    });

    if (result.source === "bridge" && result.state?.updatedAt) {
      hydratedBridgeSignatureRef.current = JSON.stringify({
        updatedAt: result.state.updatedAt,
        did: normalizeDid(result.did),
        ok: result.ok,
      });
    }

    pushEvent(
      makeEvent({
        title: `${config.input.label}：${formatStageValue(finalStage)}`,
        detail: presentation.summary,
        stage: finalStage,
        target: result.target,
        source,
      }),
    );

    setCurrentTask({
      title: config.input.label,
      status: finalStage,
      summary: result.ok ? `${presentation.summary}，${result.durationMs}ms` : presentation.summary,
      source,
      target: result.target,
      updatedAt: nowIso,
    });

    setExecutionResult({
      title: finalStage === "success" ? copy.execution.successTitle : copy.execution.errorTitle,
      body: presentation.summary,
      status: finalStage,
      source,
      raw: presentation.report,
      updatedAt: nowIso,
    });

    const nextCodexReply = buildCodexReplyStateFromOutcome({
      did: result.did,
      payload: result.payload,
      summary: presentation.summary,
      ok: result.ok,
      source,
      updatedAt: nowIso,
    });

    if (nextCodexReply) {
      setCodexReply(nextCodexReply);
    }

    startTransition(() => {
      setMetrics((currentMetrics) => evolveMetrics(currentMetrics, result));
      setMockBannerVisible(result.source === "mock");
      setHealth((currentHealth) => ({
        ...currentHealth,
        ok: result.source === "bridge",
        mode: result.source,
        latencyMs: result.durationMs,
        checkedAt: nowIso,
        state: result.state || currentHealth.state,
        error: result.source === "mock" ? result.fallbackReason || result.error : result.error,
      }));
      setStatusOverview((current) => ({
        ...current,
        bridge: result.source === "bridge" ? "Connected" : "Mock",
        model: result.usage === "model" ? "Connected" : "Idle",
        currentTarget: result.target,
      }));
    });

    setIsSending(false);
  }

  async function submitCommand() {
    const trimmed = commandInput.trim();

    if (!trimmed) {
      return;
    }

    setCommandInput("");
    const resolved = resolveCommandInput(trimmed);

    await performAction({
      input: {
        label: resolved.label,
        detail: trimmed,
        target: resolved.target,
        usage: resolved.usage,
      },
      run: () => sendAction(resolved),
    });
  }

  async function submitCodexPaste() {
    const trimmed = codexPrompt.trim();

    if (!trimmed) {
      return;
    }

    setCodexPrompt("");

    await performAction({
      input: {
        label: copy.codex.send,
        detail: previewText(trimmed, 96),
        target: "Codex 聊天框",
        usage: "local",
      },
      stages:
        codexAutoSubmit && codexReadBack
          ? {
              acceptedDetail: `已送出請求：${previewText(trimmed, 96)}`,
              acceptedBody: "已送出到 Codex，準備等待回覆摘要。",
              runningDetail: copy.codex.waiting,
              runningBody: copy.codex.waiting,
            }
          : undefined,
      codexReplyStages:
        codexAutoSubmit && codexReadBack
          ? {
              accepted: {
                stateLabel: copy.codex.replySent,
                summary: "內容已送往 Codex，準備等待最新回覆。",
                report: [
                  "【已完成】",
                  "- 已送出給 Codex",
                  "",
                  "【目前狀態】",
                  "- 等待 Codex 回覆",
                  "",
                  "【失敗/卡點】",
                  "- 無",
                  "",
                  "【下一步】",
                  "- 等待 bridge 讀取最新回覆並整理摘要",
                  "",
                  "【我現在需不需要操作】",
                  "- 不需要",
                ].join("\n"),
                status: "received",
              },
              running: {
                stateLabel: copy.codex.replyWaiting,
                summary: copy.codex.waiting,
                report: [
                  "【已完成】",
                  "- 已送出給 Codex",
                  "",
                  "【目前狀態】",
                  "- 等待 Codex 回覆",
                  "",
                  "【失敗/卡點】",
                  "- 無",
                  "",
                  "【下一步】",
                  "- 等待 bridge 讀取最新回覆並整理摘要",
                  "",
                  "【我現在需不需要操作】",
                  "- 不需要",
                ].join("\n"),
                status: "running",
              },
            }
          : undefined,
      run: () =>
        pasteToCodex({
          text: trimmed,
          autoSubmit: codexAutoSubmit,
          readBack: codexAutoSubmit && codexReadBack,
          waitForReply: codexAutoSubmit && codexReadBack,
        }),
    });
  }

  async function readCodexReplyAction() {
    await performAction({
      input: {
        label: copy.codex.readNow,
        detail: copy.codex.readBack,
        target: "Codex 聊天框",
        usage: "local",
      },
      stages: {
        acceptedDetail: "已收到讀取最新 Codex 回覆的請求。",
        acceptedBody: "準備讀取目前可見的最新 Codex 回覆。",
        runningDetail: copy.codex.waiting,
        runningBody: copy.codex.waiting,
      },
      codexReplyStages: {
        accepted: {
          stateLabel: copy.codex.replySent,
          summary: "已收到讀取最新 Codex 回覆的請求。",
          report: [
            "【已完成】",
            "- 已送出讀取最新 Codex 回覆的請求",
            "",
            "【目前狀態】",
            "- 準備讀取摘要",
            "",
            "【失敗/卡點】",
            "- 無",
            "",
            "【下一步】",
            "- 等待 bridge 擷取最新回覆",
            "",
            "【我現在需不需要操作】",
            "- 不需要",
          ].join("\n"),
          status: "received",
        },
        running: {
          stateLabel: copy.codex.replyWaiting,
          summary: copy.codex.waiting,
          report: [
            "【已完成】",
            "- 已送出讀取最新 Codex 回覆的請求",
            "",
            "【目前狀態】",
            "- 等待 Codex 回覆或等待 bridge 完成擷取",
            "",
            "【失敗/卡點】",
            "- 無",
            "",
            "【下一步】",
            "- 等待摘要整理完成",
            "",
            "【我現在需不需要操作】",
            "- 不需要",
          ].join("\n"),
          status: "running",
        },
      },
      run: () => readCodexReply(),
    });
  }

  async function captureCodexAnchorAction() {
    await performAction({
      input: {
        label: copy.codex.capture,
        detail: "請在幾秒內把滑鼠移到 Codex 聊天輸入框。",
        target: "Codex 聊天框",
        usage: "local",
      },
      run: () => captureCodexAnchor(),
    });
  }

  async function runShortcutAction(id: ShortcutId) {
    const shortcut = shortcuts.find((item) => item.id === id);

    if (!shortcut) {
      return;
    }

    await performAction({
      input: {
        label: shortcut.label,
        detail: shortcut.description,
        target: shortcut.target,
        usage: shortcut.usage,
      },
      run: () => runShortcut(id),
    });
  }

  useEffect(() => {
    void refreshHealth();

    const intervalId = window.setInterval(() => {
      void refreshHealth();
    }, healthPollMs);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    document.title = `${copy.appTitle} - ${formatBridgeValue(statusOverview.bridge)}`;
  }, [statusOverview.bridge]);

  return {
    health,
    statusOverview,
    shortcuts,
    timeline: timeline.map((event) => ({
      ...event,
      detail: `${event.detail} · ${formatClock(event.timestamp)}`,
    })),
    metrics,
    learning,
    currentTask,
    executionResult,
    codexReply,
    commandInput,
    codexPrompt,
    codexAutoSubmit,
    codexReadBack,
    codexAnchorReady: health.state?.codexAnchor.ready === true,
    activeTab,
    isSending,
    mockBannerVisible,
    setCommandInput,
    setCodexPrompt,
    setCodexAutoSubmit: updateCodexAutoSubmit,
    setCodexReadBack,
    submitCommand,
    submitCodexPaste,
    readCodexReplyNow: readCodexReplyAction,
    captureCodexAnchor: captureCodexAnchorAction,
    runShortcutAction,
    refreshHealth,
    setActiveTab,
  };
}
