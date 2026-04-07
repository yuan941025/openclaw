import type {
  GenerateSummaryInput,
  SummaryAgentService,
  SummaryNeedAction,
  SummaryReport,
  SummarySectionKey,
} from "../types/summary";

const sectionKeywords: Record<SummarySectionKey, string[]> = {
  completed: ["已完成", "完成", "done", "已處理", "已交付", "已修正", "已送出", "已收到", "已確認", "resolved"],
  current: ["目前", "正在", "進行中", "處理中", "待確認", "待整理", "驗證中", "觀察中", "等待", "staging", "pending", "review"],
  blockers: ["失敗", "卡住", "卡點", "問題", "風險", "bug", "錯誤", "未完成", "延期", "缺少", "不能", "無法", "blocked"],
  next: ["下一步", "接下來", "待辦", "todo", "follow up", "action", "請", "建議", "安排", "預計", "希望", "明天", "本週"],
};

const structuredLabels: Record<string, SummarySectionKey | "needsAction"> = {
  已完成: "completed",
  目前狀態: "current",
  "失敗/卡點": "blockers",
  下一步: "next",
  我現在需不需要操作: "needsAction",
};

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
}

function splitIntoSegments(text: string) {
  return normalizeText(text)
    .split(/\n+/)
    .flatMap((line) => line.split(/[。！？；;]/))
    .map((segment) => segment.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((segment) => segment.length >= 2);
}

function uniqueLines(lines: string[]) {
  return Array.from(new Set(lines.map((line) => line.trim()).filter(Boolean)));
}

function fillSection(lines: string[], fallback: string) {
  const normalized = uniqueLines(lines).slice(0, 3);
  return normalized.length > 0 ? normalized : [fallback];
}

function parseStructuredReport(rawText: string) {
  const buckets: Record<SummarySectionKey, string[]> = {
    completed: [],
    current: [],
    blockers: [],
    next: [],
  };
  let needsAction: SummaryNeedAction | null = null;
  let currentKey: SummarySectionKey | "needsAction" | null = null;

  for (const rawLine of normalizeText(rawText).split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const headingMatch = line.match(/^【?(已完成|目前狀態|失敗\/卡點|下一步|我現在需不需要操作)】?[:：]?/);
    if (headingMatch) {
      currentKey = structuredLabels[headingMatch[1]];
      const remainder = line.slice(headingMatch[0].length).trim().replace(/^[-*]\s*/, "");
      if (remainder) {
        if (currentKey === "needsAction") {
          needsAction = remainder.includes("不需要") ? "不需要" : "需要";
        } else {
          buckets[currentKey].push(remainder);
        }
      }
      continue;
    }

    if (!currentKey) {
      continue;
    }

    const cleaned = line.replace(/^[-*]\s*/, "").trim();
    if (!cleaned) {
      continue;
    }

    if (currentKey === "needsAction") {
      needsAction = cleaned.includes("不需要") ? "不需要" : "需要";
      continue;
    }

    buckets[currentKey].push(cleaned);
  }

  const hasStructuredContent =
    Object.values(buckets).some((lines) => lines.length > 0) || needsAction !== null;

  return hasStructuredContent ? { buckets, needsAction } : null;
}

function scoreSegment(segment: string, keywords: string[]) {
  const lower = segment.toLowerCase();
  return keywords.reduce((score, keyword) => score + (lower.includes(keyword.toLowerCase()) ? 1 : 0), 0);
}

function categorizeSegments(segments: string[]) {
  const buckets: Record<SummarySectionKey, string[]> = {
    completed: [],
    current: [],
    blockers: [],
    next: [],
  };

  for (const segment of segments) {
    const scored = (Object.keys(sectionKeywords) as SummarySectionKey[]).map((key) => ({
      key,
      score: scoreSegment(segment, sectionKeywords[key]),
    }));
    scored.sort((left, right) => right.score - left.score);

    if (scored[0].score === 0) {
      continue;
    }

    buckets[scored[0].key].push(segment);
  }

  return buckets;
}

function inferNeedsAction(rawText: string, report: Omit<SummaryReport, "generatedAt" | "sourceMode">): SummaryNeedAction {
  const normalized = normalizeText(rawText);

  if (
    report.blockers.some((line) => line !== "無") ||
    report.next.some((line) => line.includes("請") || line.includes("確認") || line.includes("補充")) ||
    /需要|請|待確認|等待|卡住|無法|風險/i.test(normalized)
  ) {
    return "需要";
  }

  return "不需要";
}

function buildFallbackReport(rawText: string): Omit<SummaryReport, "generatedAt" | "sourceMode"> {
  const structured = parseStructuredReport(rawText);

  if (structured) {
    return {
      completed: fillSection(structured.buckets.completed, "已收到內容並完成第一輪整理"),
      current: fillSection(structured.buckets.current, "內容已整理為固定格式摘要"),
      blockers: fillSection(structured.buckets.blockers, "無"),
      next: fillSection(structured.buckets.next, "請查看摘要內容後決定下一步"),
      needsAction: structured.needsAction ?? "不需要",
    };
  }

  const segments = splitIntoSegments(rawText);
  if (segments.length === 0) {
    return {
      completed: ["已收到內容"],
      current: ["待進一步整理"],
      blockers: ["資訊不足"],
      next: ["請補充更明確內容"],
      needsAction: "需要",
    };
  }

  const categorized = categorizeSegments(segments);
  const draft = {
    completed: fillSection(categorized.completed, "已收到內容並完成第一輪整理"),
    current: fillSection(
      categorized.current,
      segments.length >= 4 ? "重點內容已初步彙整，待進一步確認細節" : "內容已整理為初版摘要",
    ),
    blockers: fillSection(categorized.blockers, segments.length < 3 ? "資訊不足" : "無"),
    next: fillSection(
      categorized.next,
      segments.length >= 4 ? "建議依照目前重點安排下一步執行" : "請補充更明確內容",
    ),
    needsAction: "不需要" as SummaryNeedAction,
  };

  draft.needsAction = inferNeedsAction(rawText, draft);
  return draft;
}

function buildReport(input: GenerateSummaryInput): SummaryReport {
  const fallback = buildFallbackReport(input.rawText);

  return {
    ...fallback,
    generatedAt: new Date().toISOString(),
    sourceMode: "展示版本",
  };
}

export const mockSummaryAgentService: SummaryAgentService = {
  async generateReport(input) {
    await new Promise((resolve) => window.setTimeout(resolve, 320));
    return buildReport(input);
  },
};
