const express = require("express");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const robot = require("@jitsi/robotjs");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DEFAULT_PROJECT_PATH = "C:\\dev\\openclaw";
const PORT = Number(process.env.VSCODE_BRIDGE_PORT || 8787);
const HOST = "127.0.0.1";
const DEFAULT_CAPTURE_DELAY_MS = 3500;
const DEFAULT_REPLY_DELAY_MS = 7000;
const CODEX_REPLY_CLICK_OFFSET_Y = 260;
const MAX_CODEX_REPLY_CHARS = 12000;
const MAX_RECENT_SESSION_FILES = 24;
const MAX_SESSION_FILE_BYTES = 3 * 1024 * 1024;
const LARGE_SESSION_TAIL_BYTES = 2 * 1024 * 1024;
const DEFAULT_REPLY_LOOKBACK_MS = 1000 * 60 * 60 * 6;
const OPENAI_CHATGPT_URI = "vscode://openai.chatgpt/";
const CODEX_SESSIONS_DIR = path.join(os.homedir(), ".codex", "sessions");

const STATE = {
  lastCommand: null,
  lastResult: null,
  lastProjectPath: DEFAULT_PROJECT_PATH,
  updatedAt: null,
  codexAnchor: {
    ready: false,
    x: null,
    y: null,
    capturedAt: null,
  },
  lastCodexPrompt: {
    text: null,
    submittedAt: null,
  },
};

function now() {
  return new Date().toISOString();
}

function snapshotState() {
  return {
    lastCommand: STATE.lastCommand,
    lastResult: STATE.lastResult,
    lastProjectPath: STATE.lastProjectPath,
    updatedAt: STATE.updatedAt,
    codexAnchor: { ...STATE.codexAnchor },
  };
}

function saveResult(result) {
  STATE.lastResult = result;
  STATE.updatedAt = now();
  return result;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseBoolean(value, defaultValue = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }

  return defaultValue;
}

function parsePositiveInt(value, defaultValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return defaultValue;
}

function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value;
}

function runDetached(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore",
      shell: false,
      windowsHide: true,
      ...options,
    });

    child.once("error", reject);
    child.unref();
    resolve();
  });
}

function run(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.once("error", reject);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr.trim() || `Command exited with code ${code}`));
    });
  });
}

function tap(key, modifiers = []) {
  robot.keyTap(key, modifiers);
}

function typeText(text = "") {
  if (!text) {
    return;
  }

  robot.typeString(String(text));
}

async function setClipboardText(text) {
  const encoded = Buffer.from(String(text), "utf16le").toString("base64");
  const script = [
    `$text = [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('${encoded}'))`,
    "Set-Clipboard -Value $text",
  ].join("; ");

  await run("powershell.exe", ["-NoProfile", "-Command", script]);
  await sleep(120);
}

async function getClipboardText() {
  const script = [
    "$text = Get-Clipboard -Raw",
    "if ($null -eq $text) { return }",
    "$bytes = [System.Text.Encoding]::Unicode.GetBytes($text)",
    "[Console]::Out.Write([System.Convert]::ToBase64String($bytes))",
  ].join("; ");

  const output = String(await run("powershell.exe", ["-NoProfile", "-Command", script])).trim();
  if (!output) {
    return "";
  }

  return Buffer.from(output, "base64").toString("utf16le");
}

function normalizeCopiedReplyText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u200b/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncateText(text, max = 80) {
  const normalized = normalizeCopiedReplyText(text).replace(/\s+/g, " ");
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 1)}…`;
}

function toBulletLines(lines, fallback) {
  const normalizedLines = lines
    .map((line) => normalizeCopiedReplyText(line))
    .map((line) => line.replace(/^[-*•]\s*/, ""))
    .filter(Boolean);

  if (normalizedLines.length === 0) {
    return [`- ${fallback}`];
  }

  return normalizedLines.map((line) => `- ${line}`);
}

function parseStructuredSections(text) {
  const normalized = normalizeCopiedReplyText(text);
  if (!normalized) {
    return null;
  }

  const sections = {
    completed: [],
    status: [],
    blockers: [],
    next: [],
    action: [],
  };

  const headingMap = {
    已完成: "completed",
    目前狀態: "status",
    "失敗/卡點": "blockers",
    下一步: "next",
    我現在需不需要操作: "action",
  };

  const headingPattern =
    /^【?(已完成|目前狀態|失敗\/卡點|下一步|我現在需不需要操作)】?(?:[:：]\s*(.*))?$/;
  let currentKey = null;

  for (const rawLine of normalized.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const headingMatch = line.match(headingPattern);
    if (headingMatch) {
      currentKey = headingMap[headingMatch[1]];
      const inlineContent = normalizeCopiedReplyText(headingMatch[2] || "");
      if (inlineContent) {
        sections[currentKey].push(inlineContent);
      }
      continue;
    }

    if (currentKey) {
      sections[currentKey].push(line);
    }
  }

  return Object.values(sections).some((entries) => entries.length > 0) ? sections : null;
}

function extractMeaningfulReplyLines(text) {
  const ignorePattern =
    /^(codex|openai|new thread|new codex agent|retry|stop|copy|terminal|context|activity|search|thinking|apply|attach)$/i;

  return normalizeCopiedReplyText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !ignorePattern.test(line))
    .filter((line) => !/^[-=]{3,}$/.test(line));
}

function buildReplySummaryFromText(text) {
  const normalized = normalizeCopiedReplyText(text);
  const structured = parseStructuredSections(normalized);

  if (structured) {
    const normalizedStatusLines = structured.status
      .map((line) => normalizeCopiedReplyText(line).replace(/^[-*•]\s*/, ""))
      .filter(Boolean);
    const normalizedCompletedLines = structured.completed
      .map((line) => normalizeCopiedReplyText(line).replace(/^[-*•]\s*/, ""))
      .filter(Boolean);
    const statusLine = truncateText(
      normalizedStatusLines.join(" ") || normalizedCompletedLines.join(" "),
      90,
    );
    const status =
      !statusLine
        ? "回覆內容已擷取"
        : /Codex 回覆為|目前狀態|已收到 Codex 回覆/.test(statusLine)
          ? statusLine
          : `Codex 回覆為「${statusLine}」`;
    const report = [
      "【已完成】",
      ...toBulletLines(structured.completed, "已收到 Codex 回覆"),
      "",
      "【目前狀態】",
      ...toBulletLines(structured.status, "回覆內容已擷取"),
      "",
      "【失敗/卡點】",
      ...toBulletLines(structured.blockers, "無"),
      "",
      "【下一步】",
      ...toBulletLines(structured.next, "請查看摘要內容"),
      "",
      "【我現在需不需要操作】",
      ...toBulletLines(structured.action, "不需要"),
    ].join("\n");

    return {
      status,
      excerpt: statusLine || "已收到 Codex 回覆",
      report,
    };
  }

  const lines = extractMeaningfulReplyLines(normalized);
  const lastLine = truncateText(lines[lines.length - 1] || "", 90);
  const currentStatus = lastLine ? `Codex 回覆為「${lastLine}」` : "回覆內容已擷取";
  const report = [
    "【已完成】",
    "- 已收到 Codex 回覆",
    "- 已擷取摘要內容",
    "",
    "【目前狀態】",
    `- ${currentStatus}`,
    "",
    "【失敗/卡點】",
    "- 無",
    "",
    "【下一步】",
    "- 請查看摘要內容",
    "",
    "【我現在需不需要操作】",
    "- 不需要",
  ].join("\n");

  return {
    status: currentStatus,
    excerpt: lastLine || "已收到 Codex 回覆",
    report,
  };
}

function parseTimestampMs(value) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const timestampMs = Date.parse(value);
  return Number.isFinite(timestampMs) ? timestampMs : null;
}

function safeParseJsonLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function extractMessageText(content) {
  if (!Array.isArray(content)) {
    return "";
  }

  return normalizeCopiedReplyText(
    content
      .map((part) => {
        if (!part || typeof part !== "object") {
          return "";
        }

        if (typeof part.text === "string") {
          return part.text;
        }

        if (typeof part.message === "string") {
          return part.message;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n"),
  );
}

function walkSessionFiles(dirPath, files) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const nextPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walkSessionFiles(nextPath, files);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      const stats = fs.statSync(nextPath);
      files.push({
        path: nextPath,
        mtimeMs: stats.mtimeMs,
        size: stats.size,
      });
    }
  }
}

function getRecentSessionFiles(limit = MAX_RECENT_SESSION_FILES, sessionDir = CODEX_SESSIONS_DIR) {
  if (!fs.existsSync(sessionDir)) {
    return [];
  }

  const files = [];
  walkSessionFiles(sessionDir, files);
  return files.sort((left, right) => right.mtimeMs - left.mtimeMs).slice(0, limit);
}

function readSessionFileText(filePath, stats) {
  if (!stats.isFile() || stats.size === 0) {
    return "";
  }

  if (stats.size <= MAX_SESSION_FILE_BYTES) {
    return fs.readFileSync(filePath, "utf8");
  }

  const tailBytes = Math.min(stats.size, LARGE_SESSION_TAIL_BYTES);
  const start = Math.max(0, stats.size - tailBytes);
  const fd = fs.openSync(filePath, "r");

  try {
    const buffer = Buffer.alloc(tailBytes);
    const bytesRead = fs.readSync(fd, buffer, 0, tailBytes, start);
    let raw = buffer.subarray(0, bytesRead).toString("utf8");

    // Tail reads can start in the middle of a JSONL record, so drop the first partial line.
    if (start > 0) {
      const firstNewlineIndex = raw.indexOf("\n");
      raw = firstNewlineIndex === -1 ? "" : raw.slice(firstNewlineIndex + 1);
    }

    return raw;
  } finally {
    fs.closeSync(fd);
  }
}

function collectSessionEntries(filePath) {
  const stats = fs.statSync(filePath);

  if (!stats.isFile() || stats.size === 0) {
    return [];
  }

  const raw = readSessionFileText(filePath, stats);
  if (!raw) {
    return [];
  }
  const entries = [];

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    const parsed = safeParseJsonLine(line);
    const payload =
      parsed &&
      typeof parsed === "object" &&
      parsed.payload &&
      typeof parsed.payload === "object" &&
      !Array.isArray(parsed.payload)
        ? parsed.payload
        : null;
    const timestampMs = parseTimestampMs(parsed?.timestamp);

    if (!payload || timestampMs === null) {
      continue;
    }

    if (parsed.type === "response_item" && payload.type === "message") {
      const text = extractMessageText(payload.content);

      if (!text) {
        continue;
      }

      if (payload.role === "assistant" && payload.phase === "final_answer") {
        entries.push({
          kind: "assistant",
          text,
          timestamp: parsed.timestamp,
          timestampMs,
          source: filePath,
        });
        continue;
      }

      if (payload.role === "user") {
        entries.push({
          kind: "user",
          text,
          timestamp: parsed.timestamp,
          timestampMs,
          source: filePath,
        });
      }

      continue;
    }

    if (parsed.type === "event_msg" && payload.type === "agent_message" && payload.phase === "final_answer") {
      const text = normalizeCopiedReplyText(payload.message);

      if (text) {
        entries.push({
          kind: "assistant",
          text,
          timestamp: parsed.timestamp,
          timestampMs,
          source: filePath,
        });
      }

      continue;
    }

    if (parsed.type === "event_msg" && payload.type === "task_complete") {
      const text = normalizeCopiedReplyText(payload.last_agent_message);

      if (text) {
        entries.push({
          kind: "assistant",
          text,
          timestamp: parsed.timestamp,
          timestampMs,
          source: filePath,
        });
      }
    }
  }

  return entries;
}

function findLatestCodexReplyCandidate(options = {}) {
  const includeMeta = options.includeMeta === true;
  const promptText =
    typeof options.promptText === "string" && options.promptText.trim()
      ? normalizeCopiedReplyText(options.promptText)
      : "";
  const submittedAtMs =
    parseTimestampMs(options.submittedAt) || Date.now() - DEFAULT_REPLY_LOOKBACK_MS;
  const files = getRecentSessionFiles(MAX_RECENT_SESSION_FILES, options.sessionDir || CODEX_SESSIONS_DIR);
  let matchedCandidate = null;
  let fallbackCandidate = null;
  const meta = {
    searchedFiles: files.length,
    foundSession: false,
    foundAssistantReply: false,
    lastReplyTimestamp: null,
  };

  for (const file of files) {
    const entries = collectSessionEntries(file.path);
    if (entries.length > 0) {
      meta.foundSession = true;
    }
    let latestPromptTimestamp = null;

    for (const entry of entries) {
      if (entry.kind === "user") {
        if (promptText && entry.timestampMs >= submittedAtMs && entry.text.includes(promptText)) {
          latestPromptTimestamp = entry.timestampMs;
        }
        continue;
      }

      if (entry.timestampMs < submittedAtMs) {
        continue;
      }

      if (!meta.lastReplyTimestamp || entry.timestampMs > parseTimestampMs(meta.lastReplyTimestamp)) {
        meta.lastReplyTimestamp = entry.timestamp;
      }

      if (!fallbackCandidate || entry.timestampMs > fallbackCandidate.timestampMs) {
        fallbackCandidate = entry;
      }

      if (latestPromptTimestamp !== null && entry.timestampMs >= latestPromptTimestamp) {
        if (!matchedCandidate || entry.timestampMs > matchedCandidate.timestampMs) {
          matchedCandidate = entry;
        }
      }
    }
  }

  const candidate = matchedCandidate || fallbackCandidate;
  meta.foundAssistantReply = Boolean(candidate);

  if (candidate) {
    meta.lastReplyTimestamp = candidate.timestamp;
  }

  if (includeMeta) {
    return { candidate, meta };
  }

  return candidate;
}

function buildReadFailureReport(reason, nextStep, needsAction = true) {
  return [
    "【已完成】",
    "- 已送出至 Codex",
    "",
    "【目前狀態】",
    "- 等待回覆或讀取失敗",
    "",
    "【失敗/卡點】",
    `- ${reason}`,
    "",
    "【下一步】",
    `- ${nextStep}`,
    "",
    "【我現在需不需要操作】",
    `- ${needsAction ? "需要" : "不需要"}`,
  ].join("\n");
}

async function replaceFocusedTextWithClipboard(text) {
  await setClipboardText(text);
  tap("a", ["control"]);
  await sleep(120);
  tap("v", ["control"]);
  await sleep(220);
}

async function ensureVsCode(projectPath) {
  const resolvedProjectPath = projectPath || STATE.lastProjectPath || DEFAULT_PROJECT_PATH;
  STATE.lastProjectPath = resolvedProjectPath;
  await runDetached("cmd.exe", ["/c", "start", "", "code", "--reuse-window", resolvedProjectPath]);
  await sleep(2500);
  return resolvedProjectPath;
}

async function openCodexSidebarViaUri() {
  await runDetached("powershell.exe", [
    "-NoProfile",
    "-Command",
    `Start-Process '${OPENAI_CHATGPT_URI}'`,
  ]);
  await sleep(1800);
}

async function focusTerminal() {
  tap("`", ["control"]);
  await sleep(500);
}

async function newTerminal() {
  tap("`", ["control", "shift"]);
  await sleep(700);
}

async function openCommandPalette() {
  tap("p", ["control", "shift"]);
  await sleep(500);
}

async function executeVsCodeCommand(commandText) {
  await openCommandPalette();
  typeText(commandText);
  await sleep(300);
  tap("enter");
  await sleep(900);
}

async function runInTerminal(command) {
  await focusTerminal();
  typeText(command);
  await sleep(200);
  tap("enter");
  await sleep(600);
}

async function openFileQuick(filePath) {
  tap("p", ["control"]);
  await sleep(400);
  typeText(filePath);
  await sleep(250);
  tap("enter");
  await sleep(700);
}

async function saveFile() {
  tap("s", ["control"]);
  await sleep(300);
}

async function pasteText(text) {
  await replaceFocusedTextWithClipboard(text);
}

async function focusCodexInputFromAnchor() {
  if (!STATE.codexAnchor.ready || STATE.codexAnchor.x === null || STATE.codexAnchor.y === null) {
    throw new Error("尚未校準 Codex 聊天輸入框位置");
  }

  robot.moveMouseSmooth(STATE.codexAnchor.x, STATE.codexAnchor.y, 0.8);
  await sleep(250);
  robot.mouseClick("left");
  await sleep(250);
}

async function focusCodexReplyAreaFromAnchor() {
  if (!STATE.codexAnchor.ready || STATE.codexAnchor.x === null || STATE.codexAnchor.y === null) {
    throw new Error("尚未校準 Codex 聊天輸入框位置");
  }

  const replyY = Math.max(96, STATE.codexAnchor.y - CODEX_REPLY_CLICK_OFFSET_Y);
  robot.moveMouseSmooth(STATE.codexAnchor.x, replyY, 0.8);
  await sleep(250);
  robot.mouseClick("left");
  await sleep(280);
}

async function captureCodexAnchor(action) {
  const delayMs = parsePositiveInt(action.delayMs, DEFAULT_CAPTURE_DELAY_MS);
  await sleep(delayMs);

  const point = robot.getMousePos();
  STATE.codexAnchor = {
    ready: true,
    x: point.x,
    y: point.y,
    capturedAt: now(),
  };

  return saveResult({
    ok: true,
    did: "capture_codex_anchor",
    message: "已記住 Codex 輸入框位置",
    anchor: { ...STATE.codexAnchor },
  });
}

async function readCodexReplyInternal(action = {}) {
  const projectPath = await ensureVsCode(action.projectPath || DEFAULT_PROJECT_PATH);
  const delayMs = parsePositiveInt(action.delayMs, 0);
  const promptText =
    typeof action.promptText === "string" && action.promptText.trim()
      ? action.promptText
      : STATE.lastCodexPrompt.text || "";
  const submittedAt =
    typeof action.submittedAt === "string" && action.submittedAt
      ? action.submittedAt
      : STATE.lastCodexPrompt.submittedAt;
  const steps = {
    focusedVsCode: true,
    openedCodexSidebar: false,
    searchedSessions: false,
  };

  if (delayMs > 0) {
    await sleep(delayMs);
  }

  await openCodexSidebarViaUri();
  steps.openedCodexSidebar = true;
  await sleep(500);

  steps.searchedSessions = true;
  const lookup = findLatestCodexReplyCandidate({
    promptText,
    submittedAt,
    includeMeta: true,
  });
  const candidate = lookup?.candidate || null;
  const sessionLookup = lookup?.meta || {
    searchedFiles: 0,
    foundSession: false,
    foundAssistantReply: false,
    lastReplyTimestamp: null,
  };

  if (!candidate) {
    return {
      ok: false,
      did: "read_codex_reply",
      message: "尚未讀到 Codex 回覆內容",
      replySummary: buildReadFailureReport("讀到空內容", "請稍等 Codex 回覆完成後再試一次"),
      replyStatus: "等待回覆或讀取失敗",
      sessionLookup,
      steps,
      projectPath,
    };
  }

  const replyText = normalizeCopiedReplyText(candidate.text);

  if (replyText.length > MAX_CODEX_REPLY_CHARS) {
    return {
      ok: false,
      did: "read_codex_reply",
      message: "內容太長，暫時無法完整整理摘要",
      replySummary: buildReadFailureReport(
        "內容太長無法完整處理",
        "請讓最新回覆停留在可見範圍內後再讀一次",
      ),
      replyStatus: "等待回覆或讀取失敗",
      sessionLookup,
      steps,
      projectPath,
      replyLength: replyText.length,
    };
  }

  const summary = buildReplySummaryFromText(replyText);

  return {
    ok: true,
    did: "read_codex_reply",
    message: "已讀取最新 Codex 回覆摘要",
    replyStatus: summary.status,
    replyExcerpt: summary.excerpt,
    replySummary: summary.report,
    replyLength: replyText.length,
    replyTimestamp: candidate.timestamp,
    sessionLookup,
    steps,
    projectPath,
  };
}

async function readCodexReply(action) {
  return saveResult(await readCodexReplyInternal(action));
}

async function pasteToCodex(action) {
  const text = String(action.text || "");
  const autoSubmit = parseBoolean(action.autoSubmit, false);
  const readBack = parseBoolean(action.readBack, false) && autoSubmit;
  const waitForReply = parseBoolean(action.waitForReply, readBack);
  const replyDelayMs = parsePositiveInt(action.replyDelayMs, DEFAULT_REPLY_DELAY_MS);
  const projectPath = await ensureVsCode(action.projectPath || DEFAULT_PROJECT_PATH);
  const submittedAt = now();
  const steps = {
    focusedVsCode: true,
    openedCodexSidebar: false,
    focusedCodexInput: false,
    pasted: false,
  };

  if (!text.trim()) {
    return saveResult({
      ok: false,
      did: "paste_to_codex",
      submitted: false,
      message: "沒有可貼上的內容",
      steps,
      projectPath,
    });
  }

  await openCodexSidebarViaUri();
  steps.openedCodexSidebar = true;

  if (!STATE.codexAnchor.ready || STATE.codexAnchor.x === null || STATE.codexAnchor.y === null) {
    return saveResult({
      ok: false,
      did: "paste_to_codex",
      submitted: false,
      message: "尚未校準 Codex 聊天輸入框位置，請先按「記住 Codex 輸入框位置」",
      steps,
      projectPath,
    });
  }

  await sleep(500);
  await focusCodexInputFromAnchor();
  steps.focusedCodexInput = true;

  await replaceFocusedTextWithClipboard(text);
  steps.pasted = true;
  await sleep(250);

  if (autoSubmit) {
    STATE.lastCodexPrompt = {
      text,
      submittedAt,
    };
    tap("enter");
    await sleep(250);
  }

  if (autoSubmit && readBack) {
    const readResult = await readCodexReplyInternal({
      projectPath,
      delayMs: waitForReply ? replyDelayMs : 0,
      promptText: text,
      submittedAt,
    });

    return saveResult({
      ok: readResult.ok,
      did: "paste_to_codex",
      submitted: true,
      readBack: true,
      waitedForReply: waitForReply,
      message: readResult.ok ? "已送出並收到 Codex 摘要" : "已送出給 Codex，但尚未成功讀取回覆摘要",
      replyStatus: readResult.replyStatus || (readResult.ok ? "已收到摘要" : "等待回覆或讀取失敗"),
      replyExcerpt: readResult.replyExcerpt || null,
      replySummary: readResult.replySummary || null,
      replyLength: readResult.replyLength || null,
      steps: {
        ...steps,
        readBack: asRecord(readResult.steps),
      },
      projectPath,
    });
  }

  return saveResult({
    ok: true,
    did: "paste_to_codex",
    submitted: autoSubmit,
    message: autoSubmit ? "已貼上並送出" : "已貼上，尚未送出",
    textLength: text.length,
    steps,
    projectPath,
  });
}

async function execute(action) {
  switch (action.type) {
    case "health":
      return saveResult({
        ok: true,
        did: "health",
      });

    case "open_vscode": {
      const projectPath = await ensureVsCode(action.projectPath);
      return saveResult({
        ok: true,
        did: "open_vscode",
        projectPath,
      });
    }

    case "open_project": {
      const projectPath = await ensureVsCode(action.projectPath);
      return saveResult({
        ok: true,
        did: "open_project",
        projectPath,
      });
    }

    case "new_terminal": {
      const projectPath = await ensureVsCode(action.projectPath);
      await newTerminal();
      return saveResult({
        ok: true,
        did: "new_terminal",
        projectPath,
      });
    }

    case "run_terminal": {
      const projectPath = await ensureVsCode(action.projectPath);
      await runInTerminal(action.command || "");
      return saveResult({
        ok: true,
        did: "run_terminal",
        projectPath,
        command: action.command || "",
      });
    }

    case "open_file": {
      const projectPath = await ensureVsCode(action.projectPath);
      await openFileQuick(action.filePath || "");
      return saveResult({
        ok: true,
        did: "open_file",
        projectPath,
        filePath: action.filePath || "",
      });
    }

    case "type_text": {
      const projectPath = await ensureVsCode(action.projectPath);
      await pasteText(action.text || "");
      return saveResult({
        ok: true,
        did: "type_text",
        projectPath,
        text: action.text || "",
      });
    }

    case "save_file": {
      const projectPath = await ensureVsCode(action.projectPath);
      await saveFile();
      return saveResult({
        ok: true,
        did: "save_file",
        projectPath,
      });
    }

    case "command_palette": {
      const projectPath = await ensureVsCode(action.projectPath);
      await executeVsCodeCommand(action.commandText || "");
      return saveResult({
        ok: true,
        did: "command_palette",
        projectPath,
        commandText: action.commandText || "",
      });
    }

    case "workflow_openclaw_dev": {
      const projectPath = await ensureVsCode(action.projectPath || DEFAULT_PROJECT_PATH);
      await newTerminal();
      await runInTerminal("npm start");
      return saveResult({
        ok: true,
        did: "workflow_openclaw_dev",
        projectPath,
        command: "npm start",
      });
    }

    case "capture_codex_anchor":
      return captureCodexAnchor(action);

    case "paste_to_codex":
      return pasteToCodex(action);

    case "read_codex_reply":
      return readCodexReply(action);

    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }
}

function normalize(input = {}) {
  const q = input;

  if (q.health === "1") {
    return { type: "health" };
  }

  if (q.c === "ov") {
    return { type: "open_vscode", projectPath: q.projectPath };
  }
  if (q.c === "op") {
    return { type: "open_project", projectPath: q.projectPath };
  }
  if (q.c === "nt") {
    return { type: "new_terminal", projectPath: q.projectPath };
  }
  if (q.c === "rt") {
    return { type: "run_terminal", command: q.command || "", projectPath: q.projectPath };
  }
  if (q.c === "of") {
    return { type: "open_file", filePath: q.filePath || "", projectPath: q.projectPath };
  }
  if (q.c === "tt") {
    return { type: "type_text", text: q.text || "", projectPath: q.projectPath };
  }
  if (q.c === "sf") {
    return { type: "save_file", projectPath: q.projectPath };
  }
  if (q.c === "cp") {
    return { type: "command_palette", commandText: q.commandText || "", projectPath: q.projectPath };
  }
  if (q.c === "wo") {
    return { type: "workflow_openclaw_dev", projectPath: q.projectPath };
  }
  if (q.c === "ca") {
    return { type: "capture_codex_anchor", delayMs: q.delayMs };
  }
  if (q.c === "pc") {
    return {
      type: "paste_to_codex",
      text: q.text || "",
      autoSubmit: parseBoolean(q.autoSubmit, false),
      readBack: parseBoolean(q.readBack, false),
      waitForReply: parseBoolean(q.waitForReply, false),
      replyDelayMs: q.replyDelayMs,
      projectPath: q.projectPath,
    };
  }
  if (q.c === "rc") {
    return {
      type: "read_codex_reply",
      delayMs: q.delayMs,
      projectPath: q.projectPath,
    };
  }

  if (q.type === "capture_codex_anchor") {
    return {
      type: "capture_codex_anchor",
      delayMs: q.delayMs,
    };
  }

  if (q.type === "paste_to_codex") {
    return {
      type: "paste_to_codex",
      text: q.text || "",
      autoSubmit: parseBoolean(q.autoSubmit, false),
      readBack: parseBoolean(q.readBack, false),
      waitForReply: parseBoolean(q.waitForReply, false),
      replyDelayMs: q.replyDelayMs,
      projectPath: q.projectPath,
    };
  }

  if (q.type === "read_codex_reply") {
    return {
      type: "read_codex_reply",
      delayMs: q.delayMs,
      projectPath: q.projectPath,
    };
  }

  if (q.type) {
    return q;
  }

  return null;
}

app.all("/action", async (req, res) => {
  const merged = { ...req.query, ...req.body };
  const action = normalize(merged);

  if (!action) {
    const errorResult = saveResult({
      ok: false,
      did: "unknown_action",
      error: "No valid action",
    });
    return res.status(400).json({ ...errorResult, state: snapshotState() });
  }

  STATE.lastCommand = action;

  try {
    const result = await execute(action);
    return res.json({ ...result, state: snapshotState() });
  } catch (error) {
    const errorResult = saveResult({
      ok: false,
      did: action.type || "action_error",
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ ...errorResult, state: snapshotState() });
  }
});

app.get("/health", (_req, res) => {
  if (!STATE.updatedAt) {
    STATE.updatedAt = now();
  }

  return res.json({
    ok: true,
    state: snapshotState(),
  });
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`VS Code bridge running at http://${HOST}:${PORT}`);
  });
}

module.exports = {
  app,
  _internal: {
    buildReadFailureReport,
    buildReplySummaryFromText,
    collectSessionEntries,
    findLatestCodexReplyCandidate,
    getClipboardText,
    normalizeCopiedReplyText,
    openCodexSidebarViaUri,
    readSessionFileText,
    replaceFocusedTextWithClipboard,
    setClipboardText,
    truncateText,
  },
};
