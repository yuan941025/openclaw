import { motion } from "framer-motion";
import { Gauge, RefreshCw, Shell } from "lucide-react";
import {
  copy,
  formatBridgeValue,
  formatLobsterValue,
  formatModelValue,
} from "../../app/copy";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/ui/StatusPill";
import type { BridgeCheck } from "../../types/bridge";
import type { StatusOverview } from "../../types/dashboard";

type StatusHeaderProps = {
  health: BridgeCheck;
  statusOverview: StatusOverview;
  onRefresh: () => Promise<void>;
};

export function StatusHeader({ health, statusOverview, onRefresh }: StatusHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-white/6 px-5 py-5 shadow-card backdrop-blur-2xl lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-cyan-100/80">
              <Shell className="size-3.5" />
              {copy.header.badge}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-[0.01em] text-slate-50 sm:text-3xl">
                {copy.header.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">{copy.header.body}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-3xl border border-white/10 bg-slate-950/45 px-4 py-3 text-right text-sm text-white/62 sm:block">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">{copy.header.baseUrl}</p>
              <p className="mt-1 font-medium text-slate-100">{health.baseUrl}</p>
            </div>
            <Button
              variant="ghost"
              size="md"
              icon={<RefreshCw className="size-4" />}
              onClick={() => void onRefresh()}
            >
              {copy.header.ping}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatusPill
            label={copy.status.lobster}
            value={formatLobsterValue(statusOverview.lobster)}
            tone={statusOverview.lobster === "Online" ? "online" : "idle"}
          />
          <StatusPill
            label={copy.status.bridge}
            value={formatBridgeValue(statusOverview.bridge)}
            tone={statusOverview.bridge === "Connected" ? "online" : "mock"}
          />
          <StatusPill
            label={copy.status.model}
            value={formatModelValue(statusOverview.model)}
            tone={
              statusOverview.model === "Thinking"
                ? "thinking"
                : statusOverview.model === "Connected"
                  ? "online"
                  : "idle"
            }
          />
          <StatusPill label={copy.status.target} value={statusOverview.currentTarget} tone="idle" />
          <div className="inline-flex min-w-[132px] items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-white/70">
            <Gauge className="size-4" />
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">{copy.header.latency}</p>
              <p className="mt-1 text-sm font-medium text-slate-50">
                {typeof health.latencyMs === "number" ? `${health.latencyMs}ms` : copy.header.latencyMock}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}