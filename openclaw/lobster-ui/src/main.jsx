import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  loadBrainStatus,
  runExecution,
  runProposal,
  runTradingAnalysis,
} from "./api.js";

const initialBrainSummary = {
  matrixName: "Lobster Matrix",
  role: "AI 母體操作系統",
  currentVersion: "V2",
  currentMilestone: "V2-M2",
  currentPriority: "穩定、可用、可持續，並盡早碰到第一筆營收。",
  nextStep:
    "把 lobster-ui 收斂成更清楚的母體控制台，讓提案、執行與分析輸出都能直接使用。",
};

const initialPanelCopy = {
  proposal: {
    title: "提案節點",
    description:
      "龍蝦母體會先把需求壓縮成最小可執行提案，只保留務實、貼近變現且可立即推進的方向。",
  },
  execute: {
    title: "執行節點",
    description:
      "完成授權後，優先交付可用結果，不把控制台變成純討論面板；若有最短可行版本，就先交付最短可行版本。",
  },
};

const initialTradingFormatted = {
  ig: "",
  report: "",
  short: "",
};

const emptyValue = "尚無資料";

function readText(value, fallback = emptyValue) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function readList(value) {
  return Array.isArray(value) ? value : [];
}

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function translateRating(value) {
  const normalized = readText(value, "未知").toLowerCase();

  if (normalized === "high") {
    return "高";
  }
  if (normalized === "medium") {
    return "中";
  }
  if (normalized === "low") {
    return "低";
  }
  return readText(value, "未知");
}

function translateAction(value) {
  const normalized = readText(value, "未知").toLowerCase();

  if (normalized === "consider_buy") {
    return "考慮買入";
  }
  if (normalized === "watch") {
    return "先觀察";
  }
  if (normalized === "avoid") {
    return "避免進場";
  }
  return readText(value, "未知");
}

function translateTaskStatus(value) {
  const normalized = readText(value, "未知").toLowerCase();

  if (normalized === "success") {
    return "成功";
  }
  if (normalized === "completed") {
    return "已完成";
  }
  if (normalized === "failed" || normalized === "error") {
    return "失敗";
  }
  if (normalized === "pending") {
    return "等待中";
  }
  return readText(value, "未知");
}

function statusTone(status) {
  const normalized = readText(status, "unknown").toLowerCase();
  if (normalized === "success" || normalized === "completed") {
    return {
      border: "#14532d",
      background: "rgba(20, 83, 45, 0.22)",
      color: "#86efac",
    };
  }
  if (normalized === "failed" || normalized === "error") {
    return {
      border: "#7f1d1d",
      background: "rgba(127, 29, 29, 0.22)",
      color: "#fca5a5",
    };
  }
  return {
    border: "#1e3a8a",
    background: "rgba(30, 58, 138, 0.22)",
    color: "#93c5fd",
  };
}

function BrainField({ label, value }) {
  return (
    <div style={brainFieldStyle}>
      <div style={brainLabelStyle}>{label}</div>
      <div style={brainValueStyle}>{value}</div>
    </div>
  );
}

function CardField({ label, value }) {
  return (
    <div style={cardFieldStyle}>
      <div style={cardLabelStyle}>{label}</div>
      <div style={cardValueStyle}>{readText(value)}</div>
    </div>
  );
}

function ProposalCards({ proposals }) {
  const items = readList(proposals);

  if (items.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={cardTitleStyle}>等待提案</div>
        <div style={cardMutedStyle}>母體尚未產生提案卡片。</div>
      </div>
    );
  }

  return (
    <div style={stackStyle}>
      {items.map((proposal, index) => {
        const record = readObject(proposal) ?? {};
        return (
          <div key={`${readText(record.project_name, "proposal")}-${index}`} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={cardTitleStyle}>{readText(record.project_name, `提案 ${index + 1}`)}</div>
              <div style={badgeRowStyle}>
                <span style={metaBadgeStyle}>可行性：{translateRating(record.feasibility)}</span>
                <span style={metaBadgeStyle}>報酬：{translateRating(record.return_level)}</span>
              </div>
            </div>
            <CardField label="摘要" value={record.summary} />
            <CardField label="原因" value={record.reason} />
          </div>
        );
      })}
    </div>
  );
}

function ExecutionCards({ report, notice }) {
  const record = readObject(report);

  if (!record) {
    return (
      <div style={cardStyle}>
        <div style={cardTitleStyle}>等待執行</div>
        <div style={cardMutedStyle}>{notice}</div>
      </div>
    );
  }

  const tasks = readList(record.tasks);

  return (
    <div style={stackStyle}>
      <div style={cardStyle}>
        <div style={cardTitleStyle}>{readText(record.project_name, "執行報告")}</div>
        <CardField label="目標" value={record.goal} />
      </div>

      {tasks.length === 0 ? (
        <div style={cardStyle}>
          <div style={cardTitleStyle}>任務佇列</div>
          <div style={cardMutedStyle}>尚無任務結果。</div>
        </div>
      ) : (
        tasks.map((task, index) => {
          const taskRecord = readObject(task) ?? {};
          const tone = statusTone(taskRecord.status);
          const taskResult = taskRecord.content ?? taskRecord.result;

          return (
            <div key={`task-${index}-${readText(taskRecord.description, "item")}`} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={cardTitleStyle}>任務 {index + 1}</div>
                <span
                  style={{
                    ...statusBadgeStyle,
                    borderColor: tone.border,
                    background: tone.background,
                    color: tone.color,
                  }}
                >
                  {translateTaskStatus(taskRecord.status)}
                </span>
              </div>
              <CardField label="任務內容" value={taskRecord.description} />
              <CardField label="內容 / 結果" value={taskResult} />
            </div>
          );
        })
      )}
    </div>
  );
}

function TradingCards({ analysis, notice }) {
  const items = readList(analysis);

  if (items.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={cardTitleStyle}>等待分析</div>
        <div style={cardMutedStyle}>{notice}</div>
      </div>
    );
  }

  return (
    <div style={stackStyle}>
      {items.map((item, index) => {
        const record = readObject(item) ?? {};
        return (
          <div key={`${readText(record.symbol, "asset")}-${index}`} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={cardTitleStyle}>{readText(record.symbol, `標的 ${index + 1}`)}</div>
              <div style={badgeRowStyle}>
                <span style={metaBadgeStyle}>建議：{translateAction(record.action)}</span>
              </div>
            </div>
            <CardField label="進場區間" value={record.entry_range} />
            <CardField label="停損" value={record.stop_loss} />
            <CardField label="停利" value={record.take_profit} />
            <CardField label="分析說明" value={record.explanation} />
          </div>
        );
      })}
    </div>
  );
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function App() {
  const [taskInput, setTaskInput] = useState("");
  const [marketScope, setMarketScope] = useState("");
  const [brainSummary, setBrainSummary] = useState(initialBrainSummary);
  const [panelCopy, setPanelCopy] = useState(initialPanelCopy);
  const [status, setStatus] = useState("載入中...");
  const [proposalOutput, setProposalOutput] = useState([]);
  const [authorizationInput, setAuthorizationInput] = useState(
    JSON.stringify(
      {
        project_name: "SMB Lead Generation Sprint",
        agents: [{ role: "writer", responsibility: "write copy" }],
        tasks: [{ description: "Write landing page copy", assigned_agent: "writer" }],
        goal: "Produce first content asset",
      },
      null,
      2,
    ),
  );
  const [resultOutput, setResultOutput] = useState(null);
  const [resultNotice, setResultNotice] = useState("尚未產生執行結果。");
  const [tradingOutput, setTradingOutput] = useState([]);
  const [tradingNotice, setTradingNotice] = useState("尚未產生分析結果");
  const [tradingFormatted, setTradingFormatted] = useState(initialTradingFormatted);

  useEffect(() => {
    let isMounted = true;

    void loadBrainStatus().then((result) => {
      if (!isMounted) {
        return;
      }

      setBrainSummary({
        matrixName: readText(result.summary?.matrixName, initialBrainSummary.matrixName),
        role: initialBrainSummary.role,
        currentVersion: readText(result.summary?.currentVersion, initialBrainSummary.currentVersion),
        currentMilestone: readText(
          result.summary?.currentMilestone,
          initialBrainSummary.currentMilestone,
        ),
        currentPriority: initialBrainSummary.currentPriority,
        nextStep: initialBrainSummary.nextStep,
      });
      setPanelCopy(initialPanelCopy);
      setStatus(
        result.mode === "live-api"
          ? "已從 V1 API 同步龍蝦母體"
          : "已載入模擬龍蝦母體",
      );
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleProposal() {
    setStatus("提案產生中...");
    const result = await runProposal(taskInput, marketScope);
    setProposalOutput(readList(result.proposal));
    setStatus(result.mode === "live-api" ? "已從 V1 API 載入提案" : "已載入模擬提案");
  }

  async function handleExecute() {
    setStatus("執行中...");

    try {
      const authorization = JSON.parse(authorizationInput);
      const result = await runExecution(taskInput, marketScope, authorization);
      setProposalOutput(readList(result.proposal));
      setResultOutput(readObject(result.report));
      setResultNotice("已載入執行結果。");
      setStatus(
        result.mode === "live-api"
          ? "已透過 V1 API 完成執行"
          : "已完成模擬執行",
      );
    } catch (error) {
      setStatus("授權 JSON 格式錯誤");
      setResultOutput(null);
      setResultNotice(String(error instanceof Error ? error.message : error));
    }
  }

  async function handleTradingAnalysis() {
    setStatus("市場分析中...");
    const result = await runTradingAnalysis();
    setTradingOutput(readList(result.analysis));
    setTradingFormatted(readObject(result.formatted) ?? initialTradingFormatted);
    setTradingNotice("已載入分析結果。");
    setStatus(
      result.mode === "live-api"
        ? "已從 V1 API 載入市場分析"
        : "已載入模擬市場分析",
    );
  }

  async function handleCopyTradingFormat(formatKey, label) {
    const text = readText(tradingFormatted?.[formatKey], "");

    if (!text) {
      setTradingNotice(`${label}尚未準備好。`);
      return;
    }

    try {
      await copyTextToClipboard(text);
      setTradingNotice(`${label}已複製。`);
      setStatus(`已複製${label}`);
    } catch (error) {
      setTradingNotice(`複製失敗：${String(error instanceof Error ? error.message : error)}`);
    }
  }

  return (
    <div
      style={{
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "32px 20px 48px",
      }}
    >
      <h1 style={{ marginTop: 0 }}>lobster-ui</h1>
      <p style={{ color: "#94a3b8", marginTop: 0 }}>
        已接上同一顆 V1 龍蝦母體的控制台外殼。
      </p>

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        <section style={{ ...panelStyle, gridColumn: "1 / -1" }}>
          <h2 style={titleStyle}>母體摘要</h2>
          <p style={helperTextStyle}>
            lobster-ui 現在直接讀取 V1 母體使用中的同一份摘要與風格。
          </p>
          <div style={brainGridStyle}>
            <BrainField label="母體名稱" value={brainSummary.matrixName} />
            <BrainField label="角色定位" value={brainSummary.role} />
            <BrainField label="目前版本" value={brainSummary.currentVersion} />
            <BrainField label="目前里程碑" value={brainSummary.currentMilestone} />
            <BrainField label="當前優先目標" value={brainSummary.currentPriority} />
            <BrainField label="下一步" value={brainSummary.nextStep} />
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={titleStyle}>任務輸入</h2>
          <label style={labelStyle}>
            搜尋需求
            <input
              style={inputStyle}
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
              placeholder="尋找在地服務型商家的商機"
            />
          </label>
          <label style={labelStyle}>
            市場範圍
            <input
              style={inputStyle}
              value={marketScope}
              onChange={(event) => setMarketScope(event.target.value)}
              placeholder="台灣在地中小型服務業"
            />
          </label>
        </section>

        <section style={panelStyle}>
          <h2 style={titleStyle}>提案 / 執行</h2>
          <div style={nodeBlockStyle}>
            <strong>{panelCopy.proposal.title}</strong>
            <p style={helperTextStyle}>{panelCopy.proposal.description}</p>
            <button style={buttonStyle} onClick={() => void handleProposal()}>
              產生提案
            </button>
          </div>
          <div style={{ ...nodeBlockStyle, marginTop: "16px" }}>
            <strong>{panelCopy.execute.title}</strong>
            <p style={helperTextStyle}>{panelCopy.execute.description}</p>
            <button style={buttonStyle} onClick={() => void handleExecute()}>
              執行
            </button>
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={titleStyle}>市場分析</h2>
          <div style={nodeBlockStyle}>
            <strong>市場分析節點</strong>
            <p style={helperTextStyle}>
              啟動 V1 市場分析流程，篩選標的並轉成可直接判讀的母體建議。
            </p>
            <button style={buttonStyle} onClick={() => void handleTradingAnalysis()}>
              開始分析
            </button>
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={titleStyle}>授權與狀態</h2>
          <pre style={preStyle}>{status}</pre>
          <label style={{ ...labelStyle, marginTop: "12px" }}>
            授權 JSON
            <textarea
              style={{ ...inputStyle, minHeight: "220px", resize: "vertical" }}
              value={authorizationInput}
              onChange={(event) => setAuthorizationInput(event.target.value)}
            />
          </label>
        </section>

        <section style={panelStyle}>
          <h2 style={titleStyle}>母體輸出</h2>
          <div>
            <strong>{panelCopy.proposal.title}</strong>
            <p style={helperTextStyle}>{panelCopy.proposal.description}</p>
            <ProposalCards proposals={proposalOutput} />
          </div>
          <div style={{ marginTop: "16px" }}>
            <strong>{panelCopy.execute.title}</strong>
            <p style={helperTextStyle}>{panelCopy.execute.description}</p>
            <ExecutionCards report={resultOutput} notice={resultNotice} />
          </div>
          <div style={{ marginTop: "16px" }}>
            <strong>市場分析結果</strong>
            <p style={helperTextStyle}>
              V1 市場分析卡片，之後可再往 lobster brain 與更完整控制面板延伸。
            </p>
            <TradingCards analysis={tradingOutput} notice={tradingNotice} />
            <div style={copyActionRowStyle}>
              <button
                style={secondaryButtonStyle}
                onClick={() => void handleCopyTradingFormat("ig", "貼文格式")}
              >
                複製貼文
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={() => void handleCopyTradingFormat("report", "報告格式")}
              >
                複製報告
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={() => void handleCopyTradingFormat("short", "簡訊格式")}
              >
                複製簡訊
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const panelStyle = {
  background: "rgba(15, 23, 42, 0.82)",
  border: "1px solid #1e293b",
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 14px 40px rgba(2, 6, 23, 0.35)",
};

const titleStyle = {
  marginTop: 0,
  marginBottom: "12px",
  fontSize: "18px",
};

const labelStyle = {
  display: "block",
  marginBottom: "12px",
  color: "#cbd5e1",
};

const inputStyle = {
  width: "100%",
  marginTop: "6px",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#020617",
  color: "#e2e8f0",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #2563eb",
  background: "#1d4ed8",
  color: "white",
  cursor: "pointer",
  fontWeight: 600,
};

const helperTextStyle = {
  margin: "8px 0 12px",
  color: "#94a3b8",
  lineHeight: 1.5,
};

const preStyle = {
  margin: "8px 0 0",
  minHeight: "96px",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #1e293b",
  background: "#020617",
  color: "#bfdbfe",
  overflow: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const stackStyle = {
  display: "grid",
  gap: "12px",
  marginTop: "8px",
};

const cardStyle = {
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid #1e293b",
  background: "linear-gradient(180deg, rgba(3, 7, 18, 0.95), rgba(15, 23, 42, 0.88))",
  boxShadow: "inset 0 1px 0 rgba(148, 163, 184, 0.08)",
};

const cardHeaderStyle = {
  display: "flex",
  gap: "12px",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginBottom: "10px",
};

const cardTitleStyle = {
  color: "#f8fafc",
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: 1.4,
};

const cardMutedStyle = {
  color: "#94a3b8",
  lineHeight: 1.6,
};

const badgeRowStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const metaBadgeStyle = {
  padding: "4px 10px",
  borderRadius: "999px",
  border: "1px solid #1e3a8a",
  background: "rgba(30, 58, 138, 0.18)",
  color: "#93c5fd",
  fontSize: "12px",
};

const statusBadgeStyle = {
  padding: "4px 10px",
  borderRadius: "999px",
  border: "1px solid #334155",
  fontSize: "12px",
  textTransform: "capitalize",
};

const cardFieldStyle = {
  paddingTop: "10px",
  borderTop: "1px solid rgba(30, 41, 59, 0.9)",
};

const cardLabelStyle = {
  marginBottom: "6px",
  color: "#94a3b8",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const cardValueStyle = {
  color: "#e2e8f0",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const copyActionRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "12px",
};

const secondaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#e2e8f0",
  cursor: "pointer",
  fontWeight: 600,
};

const brainGridStyle = {
  display: "grid",
  gap: "12px",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const brainFieldStyle = {
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #1e293b",
  background: "rgba(2, 6, 23, 0.6)",
};

const brainLabelStyle = {
  marginBottom: "8px",
  color: "#94a3b8",
  fontSize: "13px",
};

const brainValueStyle = {
  color: "#f8fafc",
  lineHeight: 1.5,
};

const nodeBlockStyle = {
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #1e293b",
  background: "rgba(2, 6, 23, 0.5)",
};

createRoot(document.getElementById("root")).render(<App />);
