import { copy, shortcutCopy } from "../app/copy";
import { createMockActionResponse, createMockBridgeCheck } from "../data/mock";
import type {
  BridgeActionResponse,
  BridgeCheck,
  BridgeState,
  CodexReadInput,
  CodexPasteInput,
  SendActionInput,
  ShortcutDefinition,
  ShortcutId,
} from "../types/bridge";

const bridgeProxyBase = "/__lobster_bridge";
const defaultBridgeBaseUrl = "http://127.0.0.1:8787";
const defaultProjectPath = "C:\\dev\\openclaw";
const defaultCaptureDelayMs = 3500;
const defaultReplyDelayMs = 7000;

class BridgeHttpError extends Error {
  status: number;
  payload: Record<string, unknown> | null;

  constructor(message: string, status: number, payload: Record<string, unknown> | null) {
    super(message);
    this.name = "BridgeHttpError";
    this.status = status;
    this.payload = payload;
  }
}

export const configuredBridgeBaseUrl =
  import.meta.env.VITE_BRIDGE_BASE_URL?.trim() || defaultBridgeBaseUrl;

export const shortcuts: ShortcutDefinition[] = [
  {
    id: "open_vscode",
    label: shortcutCopy.open_vscode.label,
    description: shortcutCopy.open_vscode.description,
    target: "VS Code",
    usage: "local",
    params: {
      c: "ov",
      projectPath: defaultProjectPath,
    },
  },
  {
    id: "open_project",
    label: shortcutCopy.open_project.label,
    description: shortcutCopy.open_project.description,
    target: "OpenClaw",
    usage: "local",
    params: {
      c: "op",
      projectPath: defaultProjectPath,
    },
  },
  {
    id: "new_terminal",
    label: shortcutCopy.new_terminal.label,
    description: shortcutCopy.new_terminal.description,
    target: "VS Code 終端機",
    usage: "local",
    params: {
      c: "nt",
    },
  },
  {
    id: "run_npm_start",
    label: shortcutCopy.run_npm_start.label,
    description: shortcutCopy.run_npm_start.description,
    target: "OpenClaw 終端機",
    usage: "local",
    params: {
      c: "rt",
      command: "npm start",
    },
  },
  {
    id: "open_package_json",
    label: shortcutCopy.open_package_json.label,
    description: shortcutCopy.open_package_json.description,
    target: "package.json",
    usage: "local",
    params: {
      c: "of",
      filePath: "package.json",
    },
  },
];

function getShortcut(id: ShortcutId) {
  return shortcuts.find((shortcut) => shortcut.id === id);
}

function buildUrl(path: string, params?: Record<string, string>) {
  const url = new URL(`${bridgeProxyBase}${path}`, window.location.origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function parseBridgeState(payload: Record<string, unknown> | null | undefined): BridgeState | undefined {
  const state = asRecord(payload?.state);
  const codexAnchor = asRecord(state?.codexAnchor);

  if (!state) {
    return undefined;
  }

  return {
    lastCommand: asRecord(state.lastCommand),
    lastResult: asRecord(state.lastResult),
    updatedAt: typeof state.updatedAt === "string" ? state.updatedAt : null,
    lastProjectPath: typeof state.lastProjectPath === "string" ? state.lastProjectPath : null,
    codexAnchor: {
      ready: codexAnchor?.ready === true,
      x: typeof codexAnchor?.x === "number" ? codexAnchor.x : null,
      y: typeof codexAnchor?.y === "number" ? codexAnchor.y : null,
      capturedAt: typeof codexAnchor?.capturedAt === "string" ? codexAnchor.capturedAt : null,
    },
  };
}

function extractDid(payload: Record<string, unknown> | null | undefined, input: SendActionInput) {
  return typeof payload?.did === "string" ? payload.did : input.params.c || "action";
}

function extractErrorMessage(payload: Record<string, unknown> | null | undefined, status?: number) {
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (status) {
    return `Bridge 回傳錯誤，HTTP ${status}。`;
  }

  return "Bridge 執行失敗。";
}

function summarizePayload(input: SendActionInput, payload: Record<string, unknown>) {
  const did = typeof payload.did === "string" ? payload.did : input.params.c;

  switch (did) {
    case "capture_codex_anchor":
      return "已記住 Codex 輸入框位置";
    case "paste_to_codex":
      if (typeof payload.replyStatus === "string" && payload.replyStatus.trim()) {
        return payload.replyStatus;
      }
      return payload.submitted === true ? "已貼上並送出" : "已貼上，尚未送出";
    case "read_codex_reply":
      return typeof payload.replyStatus === "string" && payload.replyStatus.trim()
        ? payload.replyStatus
        : "已收到 Codex 摘要";
    case "run_terminal":
      return `Bridge 已執行命令：${payload.command ?? ""}`;
    case "open_file":
      return `Bridge 已開啟檔案：${payload.filePath ?? ""}`;
    case "open_project":
    case "open_vscode":
      return `Bridge 已切換到 ${payload.projectPath ?? "VS Code"}`;
    case "new_terminal":
      return "Bridge 已新增終端機";
    case "command_palette":
      return `Bridge 已執行 VS Code 指令：${payload.commandText ?? ""}`;
    case "type_text":
      return `Bridge 已輸入 ${String(payload.text ?? "").length} 個字元`;
    case "health":
      return "Bridge 健康檢查正常";
    default:
      return `${input.label} 已由 bridge 完成。`;
  }
}

async function fetchBridge(
  path: string,
  params?: Record<string, string>,
  timeoutMs = 2400,
): Promise<{ payload: Record<string, unknown>; status: number }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path, params), {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    const raw = await response.text();
    let payload: Record<string, unknown> = {};

    if (raw.trim()) {
      const parsed = JSON.parse(raw) as unknown;
      payload = asRecord(parsed) || { raw };
    }

    if (!response.ok) {
      throw new BridgeHttpError(extractErrorMessage(payload, response.status), response.status, payload);
    }

    return {
      payload,
      status: response.status,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function createBridgeFailureResponse(
  input: SendActionInput,
  payload: Record<string, unknown> | null,
  durationMs: number,
  status?: number,
): BridgeActionResponse {
  const error = extractErrorMessage(payload, status);

  return {
    ok: false,
    source: "bridge",
    did: extractDid(payload, input),
    label: input.label,
    summary: error,
    target: input.target,
    usage: input.usage,
    durationMs,
    payload,
    state: parseBridgeState(payload),
    error,
  };
}

function createDisconnectedResponse(
  input: SendActionInput,
  durationMs: number,
  fallbackReason: string,
): BridgeActionResponse {
  const friendlyReason =
    input.params.c === "pc" || input.params.c === "ca" || input.params.c === "rc"
      ? "無法連到 bridge，請先啟動 bridge 後再試一次。"
      : fallbackReason;

  return {
    ok: false,
    source: "mock",
    did: input.params.c || "action",
    label: input.label,
    summary: friendlyReason,
    target: input.target,
    usage: input.usage,
    durationMs,
    payload: null,
    error: friendlyReason,
    fallbackReason: friendlyReason,
  };
}

type SendActionOptions = {
  allowMockFallback?: boolean;
};

export async function checkHealth(): Promise<BridgeCheck> {
  const startedAt = performance.now();

  try {
    const { payload } = await fetchBridge("/health", undefined, 1800);
    const state = parseBridgeState(payload);

    if (payload.ok !== true) {
      return {
        ...createMockBridgeCheck(extractErrorMessage(payload)),
        baseUrl: configuredBridgeBaseUrl,
        state,
      };
    }

    return {
      ok: true,
      mode: "bridge",
      baseUrl: configuredBridgeBaseUrl,
      latencyMs: Math.round(performance.now() - startedAt),
      checkedAt: new Date().toISOString(),
      state,
    };
  } catch (error) {
    if (error instanceof BridgeHttpError) {
      return {
        ...createMockBridgeCheck(error.message),
        baseUrl: configuredBridgeBaseUrl,
        state: parseBridgeState(error.payload),
      };
    }

    return {
      ...createMockBridgeCheck(error instanceof Error ? error.message : "Bridge 目前不可用。"),
      baseUrl: configuredBridgeBaseUrl,
    };
  }
}

export async function sendAction(
  input: SendActionInput,
  options: SendActionOptions = {},
): Promise<BridgeActionResponse> {
  const startedAt = performance.now();
  const timeoutMs =
    input.params.c === "pc" && input.params.readBack === "true"
      ? 22000
      : input.params.c === "rc"
        ? 12000
        : 9000;

  try {
    const { payload, status } = await fetchBridge("/action", input.params, timeoutMs);
    const durationMs = Math.round(performance.now() - startedAt);

    if (payload.ok === false) {
      return createBridgeFailureResponse(input, payload, durationMs, status);
    }

    return {
      ok: true,
      source: "bridge",
      did: extractDid(payload, input),
      label: input.label,
      summary: summarizePayload(input, payload),
      target: input.target,
      usage: input.usage,
      durationMs,
      payload,
      state: parseBridgeState(payload),
    };
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt);

    if (error instanceof BridgeHttpError) {
      return createBridgeFailureResponse(input, error.payload, durationMs, error.status);
    }

    const fallbackReason =
      error instanceof Error ? error.message : "Bridge 無法連線，請稍後再試。";

    if (options.allowMockFallback === false) {
      return createDisconnectedResponse(input, durationMs, fallbackReason);
    }

    return createMockActionResponse(input, fallbackReason);
  }
}

export async function runShortcut(id: ShortcutId): Promise<BridgeActionResponse> {
  const shortcut = getShortcut(id);

  if (!shortcut) {
    return createDisconnectedResponse(
      {
        label: "未知快捷動作",
        description: "找不到指定快捷動作。",
        target: "Lobster UI",
        usage: "local",
        params: { c: "unknown" },
      },
      0,
      "找不到指定快捷動作。",
    );
  }

  return sendAction(shortcut);
}

export async function captureCodexAnchor() {
  return sendAction(
    {
      label: copy.codex.capture,
      description: copy.codex.helper,
      target: "Codex 聊天框",
      usage: "local",
      params: {
        c: "ca",
        delayMs: String(defaultCaptureDelayMs),
      },
    },
    { allowMockFallback: false },
  );
}

export async function pasteToCodex(input: CodexPasteInput) {
  return sendAction(
    {
      label: copy.codex.send,
      description: copy.codex.title,
      target: "Codex 聊天框",
      usage: "local",
      params: {
        c: "pc",
        text: input.text,
        autoSubmit: input.autoSubmit ? "true" : "false",
        readBack: input.readBack ? "true" : "false",
        waitForReply: input.waitForReply === false ? "false" : "true",
        replyDelayMs: String(input.replyDelayMs ?? defaultReplyDelayMs),
        projectPath: input.projectPath || defaultProjectPath,
      },
    },
    { allowMockFallback: false },
  );
}

export async function readCodexReply(input: CodexReadInput = {}) {
  return sendAction(
    {
      label: copy.codex.readNow,
      description: copy.codex.readBack,
      target: "Codex 聊天框",
      usage: "local",
      params: {
        c: "rc",
        delayMs: String(input.delayMs ?? 0),
        projectPath: input.projectPath || defaultProjectPath,
      },
    },
    { allowMockFallback: false },
  );
}

function looksLikeTerminalCommand(value: string) {
  return /^(npm|pnpm|bun|node|npx|git|cd|dir|type|code)\b/i.test(value.trim());
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function resolveCommandInput(command: string): SendActionInput {
  const trimmed = command.trim();
  const lower = trimmed.toLowerCase();

  if (
    includesAny(lower, ["open vscode", "launch code"]) ||
    includesAny(trimmed, ["打開 vscode", "打開 vs code", "開啟 vscode", "開啟 vs code"])
  ) {
    return getShortcut("open_vscode")!;
  }

  if (
    includesAny(lower, ["open openclaw", "open project"]) ||
    includesAny(trimmed, ["打開 openclaw", "開啟 openclaw", "打開 openclaw 專案", "開啟 openclaw 專案"])
  ) {
    return getShortcut("open_project")!;
  }

  if (
    includesAny(lower, ["new terminal", "terminal"]) ||
    includesAny(trimmed, ["新增終端機", "新終端機", "打開終端機", "開啟終端機"])
  ) {
    return getShortcut("new_terminal")!;
  }

  if (
    lower === "npm start" ||
    includesAny(lower, ["run npm start"]) ||
    includesAny(trimmed, ["執行 npm start", "跑 npm start"])
  ) {
    return getShortcut("run_npm_start")!;
  }

  if (
    includesAny(lower, ["package.json"]) ||
    includesAny(trimmed, ["開啟 package.json", "打開 package.json"])
  ) {
    return getShortcut("open_package_json")!;
  }

  if (looksLikeTerminalCommand(trimmed)) {
    return {
      label: "執行終端機命令",
      description: "將原始命令直接送給 VS Code bridge 的終端機流程。",
      target: "OpenClaw 終端機",
      usage: "local",
      params: {
        c: "rt",
        command: trimmed,
      },
    };
  }

  return {
    label: "輸入文字",
    description: "把內容作為一般輸入文字送往 bridge。",
    target: "VS Code",
    usage: "model",
    params: {
      c: "tt",
      text: trimmed,
    },
  };
}
