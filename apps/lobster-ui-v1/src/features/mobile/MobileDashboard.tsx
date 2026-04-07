import { AnimatePresence, motion } from "framer-motion";
import {
  Crosshair,
  FolderOpen,
  PackageOpen,
  Play,
  SendHorizonal,
  SquareTerminal,
  WandSparkles,
} from "lucide-react";
import {
  copy,
  formatBridgeValue,
  formatLobsterValue,
  formatModelValue,
  formatSourceValue,
  formatStageValue,
} from "../../app/copy";
import { Banner } from "../../components/ui/Banner";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusPill } from "../../components/ui/StatusPill";
import { TabBar } from "../../components/ui/TabBar";
import { TextArea } from "../../components/ui/TextArea";
import { CodexReplyPanel } from "../dashboard/CodexReplyPanel";
import { ExecutionResult } from "../dashboard/ExecutionResult";
import type { DashboardState } from "../../types/dashboard";

type MobileDashboardProps = {
  dashboard: DashboardState;
};

const shortcutIcons = {
  open_vscode: WandSparkles,
  open_project: FolderOpen,
  new_terminal: SquareTerminal,
  run_npm_start: Play,
  open_package_json: PackageOpen,
};

function stageTone(stage: DashboardState["currentTask"]["status"]) {
  switch (stage) {
    case "success":
      return "online";
    case "running":
      return "thinking";
    case "error":
      return "mock";
    default:
      return "idle";
  }
}

export function MobileDashboard({ dashboard }: MobileDashboardProps) {
  const topShortcuts = dashboard.shortcuts.slice(0, 4);
  const packageShortcut = dashboard.shortcuts.find((item) => item.id === "open_package_json");

  return (
    <>
      <div className="space-y-4 pb-28 lg:hidden">
        <Card className="p-4" accent="cyan">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-100/70">{copy.mobile.eyebrow}</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-50">{copy.mobile.title}</h1>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <StatusPill
                label={copy.status.lobster}
                value={formatLobsterValue(dashboard.statusOverview.lobster)}
                tone="online"
              />
              <StatusPill
                label={copy.status.bridge}
                value={formatBridgeValue(dashboard.statusOverview.bridge)}
                tone={dashboard.statusOverview.bridge === "Connected" ? "online" : "mock"}
              />
              <StatusPill
                label={copy.status.model}
                value={formatModelValue(dashboard.statusOverview.model)}
                tone={
                  dashboard.statusOverview.model === "Thinking"
                    ? "thinking"
                    : dashboard.statusOverview.model === "Connected"
                      ? "online"
                      : "idle"
                }
              />
            </div>
          </div>
        </Card>

        {dashboard.mockBannerVisible ? (
          <Banner tone="warning" title={copy.banner.mockTitle} body={copy.banner.mockBody} />
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={dashboard.activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {dashboard.activeTab === "control" ? (
              <div className="space-y-4">
                <Card className="p-5" accent="cyan">
                  <div className="space-y-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.mobile.codexEyebrow}</p>
                    <div className="space-y-2">
                      <p className="text-base font-medium text-slate-50">{copy.codex.title}</p>
                      <TextArea
                        className="min-h-[220px] px-5 py-5 text-base leading-7"
                        value={dashboard.codexPrompt}
                        onChange={(event) => dashboard.setCodexPrompt(event.target.value)}
                        placeholder={copy.codex.placeholder}
                      />
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.codex.statusLabel}</p>
                      <p className="mt-2 text-sm text-white/74">
                        {dashboard.codexAnchorReady ? copy.codex.calibrated : copy.codex.uncalibrated}
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-3 text-sm text-white/76">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-white/20 bg-slate-950/55 text-cyan-300 focus:ring-cyan-300/40"
                        checked={dashboard.codexAutoSubmit}
                        onChange={(event) => dashboard.setCodexAutoSubmit(event.target.checked)}
                      />
                      <span>{copy.codex.autoSubmit}</span>
                    </label>

                    <label className="inline-flex items-center gap-3 text-sm text-white/76">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-white/20 bg-slate-950/55 text-cyan-300 focus:ring-cyan-300/40"
                        checked={dashboard.codexReadBack}
                        disabled={!dashboard.codexAutoSubmit}
                        onChange={(event) => dashboard.setCodexReadBack(event.target.checked)}
                      />
                      <span>{copy.codex.readBack}</span>
                    </label>

                    <div className="grid gap-3">
                      <Button
                        variant="primary"
                        size="lg"
                        icon={<SendHorizonal className="size-4" />}
                        loading={dashboard.isSending}
                        className="h-16 w-full text-base"
                        onClick={() => void dashboard.submitCodexPaste()}
                      >
                        {dashboard.isSending ? copy.codex.sending : copy.codex.send}
                      </Button>

                      <Button
                        variant="secondary"
                        size="lg"
                        icon={<Crosshair className="size-4" />}
                        className="h-16 w-full text-base"
                        onClick={() => void dashboard.captureCodexAnchor()}
                      >
                        {copy.codex.capture}
                      </Button>

                      <Button
                        variant="secondary"
                        size="lg"
                        className="h-16 w-full text-base"
                        onClick={() => void dashboard.readCodexReplyNow()}
                      >
                        {copy.codex.readNow}
                      </Button>
                    </div>
                  </div>
                </Card>

                <CodexReplyPanel reply={dashboard.codexReply} />

                <Card className="p-5" accent="cyan">
                  <div className="space-y-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.mobile.commandEyebrow}</p>
                    <TextArea
                      className="min-h-[180px] px-5 py-5 text-base leading-7"
                      value={dashboard.commandInput}
                      onChange={(event) => dashboard.setCommandInput(event.target.value)}
                      placeholder={copy.control.placeholder}
                    />
                    <Button
                      variant="primary"
                      size="lg"
                      icon={<SendHorizonal className="size-4" />}
                      loading={dashboard.isSending}
                      className="h-16 w-full text-base"
                      onClick={() => void dashboard.submitCommand()}
                    >
                      {dashboard.isSending ? copy.control.sending : copy.control.send}
                    </Button>
                  </div>
                </Card>

                <Card className="p-5" accent="violet">
                  <div className="space-y-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.mobile.quickEyebrow}</p>
                    <div className="grid grid-cols-2 gap-4">
                      {topShortcuts.map((shortcut) => {
                        const Icon = shortcutIcons[shortcut.id];
                        return (
                          <button
                            key={shortcut.id}
                            type="button"
                            onClick={() => void dashboard.runShortcutAction(shortcut.id)}
                            className="min-h-[144px] rounded-[26px] border border-white/10 bg-white/6 p-4 text-left"
                          >
                            <div className="mb-3 inline-flex rounded-2xl border border-white/10 bg-slate-950/45 p-2 text-cyan-100/78">
                              <Icon className="size-4" />
                            </div>
                            <p className="text-base font-medium text-slate-50">{shortcut.label}</p>
                            <p className="mt-2 text-sm leading-6 text-white/56">{shortcut.description}</p>
                          </button>
                        );
                      })}
                    </div>
                    {packageShortcut ? (
                      <button
                        type="button"
                        onClick={() => void dashboard.runShortcutAction(packageShortcut.id)}
                        className="w-full rounded-[22px] border border-white/10 bg-slate-950/45 px-4 py-4 text-base text-white/72"
                      >
                        {packageShortcut.label}
                      </button>
                    ) : null}
                  </div>
                </Card>
              </div>
            ) : null}

            {dashboard.activeTab === "activity" ? (
              <div className="space-y-3">
                <Card className="p-4" accent="cyan">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.mobile.currentTaskEyebrow}</p>
                        <h2 className="mt-2 text-lg font-semibold text-slate-50">{dashboard.currentTask.title}</h2>
                      </div>
                      <StatusPill
                        label={copy.task.state}
                        value={formatStageValue(dashboard.currentTask.status)}
                        tone={stageTone(dashboard.currentTask.status)}
                      />
                    </div>
                    <p className="text-sm leading-6 text-white/60">{dashboard.currentTask.summary}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-white/60">
                      <span className="rounded-full border border-white/10 px-3 py-1">{formatSourceValue(dashboard.currentTask.source)}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1">{dashboard.currentTask.target}</span>
                    </div>
                  </div>
                </Card>

                <ExecutionResult result={dashboard.executionResult} />

                {dashboard.timeline.slice(0, 6).map((event) => (
                  <Card key={event.id} className="p-4" accent="neutral">
                    <p className="text-sm font-medium text-slate-50">{event.title}</p>
                    <p className="mt-2 text-xs text-white/45">{formatStageValue(event.stage)}</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/60">{event.detail}</p>
                  </Card>
                ))}
              </div>
            ) : null}

            {dashboard.activeTab === "metrics" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4" accent="neutral">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.metrics.commands}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-50">{dashboard.metrics.todayCommands}</p>
                  </Card>
                  <Card className="p-4" accent="neutral">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.metrics.success}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-50">{dashboard.metrics.successRate}%</p>
                  </Card>
                  <Card className="p-4" accent="neutral">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.metrics.avgResponse}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-50">{dashboard.metrics.avgResponseMs}ms</p>
                  </Card>
                  <Card className="p-4" accent="neutral">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.metrics.localRatio}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-50">
                      {dashboard.metrics.localExecutionRatio}%
                    </p>
                  </Card>
                </div>

                <Card className="p-4" accent="violet">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.metrics.tokenCost}</p>
                  <p className="mt-3 text-xl font-semibold text-slate-50">{dashboard.metrics.tokenCostLabel}</p>
                </Card>
              </div>
            ) : null}

            {dashboard.activeTab === "learn" ? (
              <div className="space-y-3">
                <Card className="p-4" accent="violet">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.learning.status}</p>
                  <p className="mt-3 text-sm leading-7 text-white/62">{dashboard.learning.status}</p>
                </Card>
                <Card className="p-4" accent="neutral">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                    {copy.learning.optimizations}
                  </p>
                  <div className="mt-3 space-y-2">
                    {dashboard.learning.recentOptimizations.map((item) => (
                      <p key={item} className="text-sm leading-6 text-white/62">
                        {item}
                      </p>
                    ))}
                  </div>
                </Card>
                <Card className="p-4" accent="neutral">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.learning.failure}</p>
                  <p className="mt-3 text-sm leading-6 text-white/62">{dashboard.learning.lastFailure}</p>
                </Card>
                <Card className="p-4" accent="cyan">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{copy.learning.suggestion}</p>
                  <p className="mt-3 text-sm leading-6 text-white/62">{dashboard.learning.nextSuggestion}</p>
                </Card>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <TabBar activeTab={dashboard.activeTab} onSelect={dashboard.setActiveTab} />
    </>
  );
}
