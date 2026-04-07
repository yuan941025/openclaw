import { useEffect, useMemo, useRef, useState } from "react";
import { summaryExamples } from "../data/examples";
import { mockSummaryAgentService } from "../services/summaryAgent";
import { readTrialStats, trackTrialEvent } from "../services/trialFeedbackStore";
import type { SummaryExample, SummaryReport } from "../types/summary";
import type { TrialFeedbackChoice, TrialStats } from "../types/trial-feedback";

function createEmptyReport(): SummaryReport {
  return {
    completed: ["尚未建立摘要"],
    current: ["等待貼入內容"],
    blockers: ["無"],
    next: ["貼入內容後按下「建立摘要」"],
    needsAction: "不需要",
    generatedAt: null,
    sourceMode: "展示版本",
  };
}

export function useSummaryAgent() {
  const [selectedExampleId, setSelectedExampleId] = useState<SummaryExample["id"]>("meeting");
  const [rawInput, setRawInput] = useState("");
  const [report, setReport] = useState<SummaryReport>(createEmptyReport);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<TrialStats>(() => readTrialStats());
  const [feedbackChoice, setFeedbackChoice] = useState<TrialFeedbackChoice | null>(null);
  const [isFounderPreviewOpen, setIsFounderPreviewOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return new URLSearchParams(window.location.search).get("founder") === "1";
  });
  const hasTrackedPageView = useRef(false);

  const selectedExample = useMemo(
    () => summaryExamples.find((example) => example.id === selectedExampleId) || summaryExamples[0],
    [selectedExampleId],
  );

  useEffect(() => {
    if (typeof window === "undefined" || hasTrackedPageView.current) {
      return;
    }

    hasTrackedPageView.current = true;

    const sessionKey = "actionbrief-page-view-recorded";
    if (window.sessionStorage.getItem(sessionKey)) {
      return;
    }

    window.sessionStorage.setItem(sessionKey, "1");
    setStats(trackTrialEvent({ type: "page_view" }));
  }, []);

  function applyTrialEvent(event: Parameters<typeof trackTrialEvent>[0]) {
    const nextStats = trackTrialEvent(event);
    setStats(nextStats);
  }

  async function generateReport(nextRawText?: string) {
    const finalRawText = (nextRawText ?? rawInput).trim();
    setIsGenerating(true);
    setFeedbackChoice(null);
    applyTrialEvent({ type: "generate_click" });

    try {
      const nextReport = await mockSummaryAgentService.generateReport({ rawText: finalRawText });
      setReport(nextReport);
      applyTrialEvent({ type: "successful_output" });
    } finally {
      setIsGenerating(false);
    }
  }

  async function loadExample() {
    applyTrialEvent({ type: "example_click", exampleId: selectedExample.id });
    setRawInput(selectedExample.content);
    await generateReport(selectedExample.content);
  }

  function selectExample(id: SummaryExample["id"]) {
    if (id === selectedExampleId) {
      return;
    }

    setSelectedExampleId(id);
    applyTrialEvent({ type: "scenario_switch", exampleId: id });
  }

  function submitFeedback(choice: TrialFeedbackChoice) {
    if (feedbackChoice) {
      return;
    }

    setFeedbackChoice(choice);
    applyTrialEvent({ type: "feedback", value: choice });
  }

  return {
    examples: summaryExamples,
    selectedExample,
    selectedExampleId,
    setSelectedExampleId: selectExample,
    rawInput,
    setRawInput,
    report,
    isGenerating,
    generateReport,
    loadExample,
    stats,
    feedbackChoice,
    submitFeedback,
    isFounderPreviewOpen,
    setIsFounderPreviewOpen,
  };
}
