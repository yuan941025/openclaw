import type { ShortcutId } from "../types/bridge";
import type { MobileTab, TaskCardState, TimelineEvent } from "../types/dashboard";

export const copy = {
  appTitle: "龍蝦科技控制台 v1",
  appDescription: "透過 OpenClaw bridge 控制 VS Code、終端機與 Codex 貼上流程。",
  banner: {
    mockTitle: "目前為模擬模式",
    mockBody:
      "現在無法連到 bridge，畫面仍可展示，但只有 bridge 重新連線後才會執行真實動作。",
  },
  header: {
    badge: "Lobster UI v1",
    title: "OpenClaw 本地控制台",
    body: "用同一個面板查看 bridge 狀態、快速送出常用動作，並把內容直接貼進 VS Code 的 Codex 聊天框。",
    baseUrl: "Bridge 位址",
    ping: "健康檢查",
    target: "目前目標",
    latency: "回應延遲",
    latencyMock: "模擬模式",
  },
  status: {
    lobster: "Lobster",
    bridge: "Bridge",
    model: "模型",
    target: "目前目標",
  },
  control: {
    eyebrow: "控制區",
    title: "輸入指令並送往 bridge",
    body: "可輸入自然語言、常用命令，或直接呼叫既有 bridge 動作。這一區保留目前的通用控制流程。",
    placeholder: "在這裡輸入指令，例如：打開 VS Code、執行 npm start，或直接貼上你要送出的命令",
    helper: "如果 bridge 暫時不可用，通用動作會退回模擬模式；Codex 貼上流程則會直接回報失敗摘要。",
    sending: "送出中",
    send: "送出指令",
    quickEyebrow: "快捷動作",
    quickTitle: "常用 bridge 動作",
    quickBody: "快速打開 VS Code、OpenClaw 專案、終端機或常用檔案。",
  },
  codex: {
    eyebrow: "Codex 貼上流程",
    title: "要貼給 Codex 的內容",
    body: "先校準一次 Codex 聊天輸入框位置，之後就能從龍蝦面板直接貼上到 VS Code。",
    placeholder: "在這裡輸入施工包、命令或要貼給 Codex 的內容",
    helper: "bridge 重啟後需要重新校準一次。校準時按下按鈕後，請在幾秒內把滑鼠移到 Codex 聊天框。",
    send: "貼到 Codex",
    sending: "貼上中",
    autoSubmit: "貼上後自動送出",
    readBack: "等待 Codex 回覆並回傳摘要",
    readNow: "立即讀取最新 Codex 回覆",
    waiting: "等待 Codex 回覆",
    summaryReady: "已收到摘要",
    readBackFailed: "已送出給 Codex，但尚未成功讀取回覆摘要",
    capture: "記住 Codex 輸入框位置",
    statusLabel: "聊天框定位",
    calibrated: "已校準",
    uncalibrated: "未校準",
    latestReplyEyebrow: "Codex 最新回覆",
    latestReplyTitle: "摘要戰報",
    latestReplyState: "回覆狀態",
    replySent: "已送出",
    replyWaiting: "等待 Codex 回覆",
    replyReceived: "已收到回覆",
    replyFailed: "讀取失敗",
  },
  mobile: {
    eyebrow: "Lobster 控制台",
    title: "手機控制頁",
    commandEyebrow: "通用指令",
    codexEyebrow: "Codex 貼上",
    quickEyebrow: "快捷動作",
    currentTaskEyebrow: "目前任務",
  },
  activity: {
    eyebrow: "動作紀錄",
    title: "最近執行流程",
  },
  execution: {
    eyebrow: "執行結果",
    successTitle: "執行完成",
    errorTitle: "執行失敗",
    acceptedTitle: "已接收",
    runningTitle: "執行中",
  },
  metrics: {
    eyebrow: "即時數據",
    title: "控制台指標",
    commands: "今日指令數",
    commandsCaption: "今天已送出的控制與快捷動作數量。",
    success: "成功率",
    successCaption: "成功完成的 bridge 或模型流程比例。",
    avgResponse: "平均回應時間",
    avgResponseCaption: "以目前面板統計出的平均完成時間。",
    localRatio: "本地執行比例",
    localRatioCaption: "透過本機 bridge 完成的動作比例。",
    modelRatio: "模型使用比例",
    modelRatioCaption: "走模型推理或生成流程的比例。",
    tokenCost: "Token / 成本",
    tokenCostCaption: "目前先用 placeholder 顯示，保留後續擴充空間。",
    flowEyebrow: "流量趨勢",
    flowTitle: "指令節奏",
  },
  learning: {
    eyebrow: "Learning 區",
    title: "學習與建議",
    status: "Learning Status",
    optimizations: "Recent Optimizations",
    failure: "Last Failure",
    suggestion: "Next Suggestion",
  },
  task: {
    eyebrow: "目前任務",
    state: "狀態",
  },
  tabs: {
    control: "控制",
    activity: "紀錄",
    metrics: "數據",
    learn: "學習",
  } satisfies Record<MobileTab, string>,
} as const;

const lobsterValueMap = {
  Online: "在線",
  Offline: "離線",
} as const;

const bridgeValueMap = {
  Connected: "已連線",
  Mock: "模擬模式",
} as const;

const modelValueMap = {
  Connected: "已連線",
  Idle: "待命",
  Thinking: "執行中",
} as const;

const stageValueMap = {
  received: "已接收",
  running: "執行中",
  success: "完成",
  error: "失敗",
} as const;

const sourceValueMap = {
  bridge: "真實 bridge",
  mock: "模擬模式",
} as const;

export const shortcutCopy: Record<
  ShortcutId,
  {
    label: string;
    description: string;
    mobileLabel?: string;
  }
> = {
  open_vscode: {
    label: "打開 VS Code",
    description: "喚醒 VS Code，並將 OpenClaw 專案帶到前景。",
  },
  open_project: {
    label: "打開 OpenClaw 專案",
    description: "在 VS Code 內切回 OpenClaw 專案視窗。",
  },
  new_terminal: {
    label: "新增終端機",
    description: "在 VS Code 內開啟新的整合式終端機。",
  },
  run_npm_start: {
    label: "執行 npm start",
    description: "在 VS Code 終端機執行 `npm start`。",
  },
  open_package_json: {
    label: "開啟 package.json",
    description: "快速打開 `package.json` 方便確認設定。",
    mobileLabel: "開啟 package.json",
  },
};

export function formatLobsterValue(value: keyof typeof lobsterValueMap) {
  return lobsterValueMap[value];
}

export function formatBridgeValue(value: keyof typeof bridgeValueMap) {
  return bridgeValueMap[value];
}

export function formatModelValue(value: keyof typeof modelValueMap) {
  return modelValueMap[value];
}

export function formatStageValue(stage: TaskCardState["status"] | TimelineEvent["stage"]) {
  return stageValueMap[stage];
}

export function formatSourceValue(source: "bridge" | "mock") {
  return sourceValueMap[source];
}

export function getTabLabel(tab: MobileTab) {
  return copy.tabs[tab];
}
