import { ActivityTimeline } from "./ActivityTimeline";
import { CodexReplyPanel } from "./CodexReplyPanel";
import { ControlPanel } from "./ControlPanel";
import { ExecutionResult } from "./ExecutionResult";
import { LearningPanel } from "./LearningPanel";
import { MetricsPanel } from "./MetricsPanel";
import { TaskCard } from "./TaskCard";
import type { DashboardState } from "../../types/dashboard";

type DesktopDashboardProps = {
  dashboard: DashboardState;
};

export function DesktopDashboard({ dashboard }: DesktopDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(360px,1.15fr)_minmax(380px,1.3fr)_minmax(300px,0.95fr)]">
        <ControlPanel
          commandInput={dashboard.commandInput}
          codexPrompt={dashboard.codexPrompt}
          codexAutoSubmit={dashboard.codexAutoSubmit}
          codexReadBack={dashboard.codexReadBack}
          codexAnchorReady={dashboard.codexAnchorReady}
          setCommandInput={dashboard.setCommandInput}
          setCodexPrompt={dashboard.setCodexPrompt}
          setCodexAutoSubmit={dashboard.setCodexAutoSubmit}
          setCodexReadBack={dashboard.setCodexReadBack}
          onSubmit={dashboard.submitCommand}
          onSubmitCodex={dashboard.submitCodexPaste}
          onReadCodexReply={dashboard.readCodexReplyNow}
          onCaptureCodexAnchor={dashboard.captureCodexAnchor}
          onShortcut={dashboard.runShortcutAction}
          shortcuts={dashboard.shortcuts}
          isSending={dashboard.isSending}
        />

        <div className="space-y-4">
          <TaskCard task={dashboard.currentTask} />
          <CodexReplyPanel reply={dashboard.codexReply} />
          <ActivityTimeline events={dashboard.timeline} />
          <ExecutionResult result={dashboard.executionResult} />
        </div>

        <MetricsPanel metrics={dashboard.metrics} />
      </div>

      <LearningPanel learning={dashboard.learning} />
    </div>
  );
}
