import { motion } from "framer-motion";
import {
  Crosshair,
  FolderOpen,
  PackageOpen,
  Play,
  SendHorizonal,
  SquareTerminal,
  WandSparkles,
} from "lucide-react";
import { copy } from "../../app/copy";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { TextArea } from "../../components/ui/TextArea";
import type { ShortcutDefinition } from "../../types/bridge";

type ControlPanelProps = {
  commandInput: string;
  codexPrompt: string;
  codexAutoSubmit: boolean;
  codexReadBack: boolean;
  codexAnchorReady: boolean;
  setCommandInput: (value: string) => void;
  setCodexPrompt: (value: string) => void;
  setCodexAutoSubmit: (value: boolean) => void;
  setCodexReadBack: (value: boolean) => void;
  onSubmit: () => Promise<void>;
  onSubmitCodex: () => Promise<void>;
  onReadCodexReply: () => Promise<void>;
  onCaptureCodexAnchor: () => Promise<void>;
  onShortcut: (id: ShortcutDefinition["id"]) => Promise<void>;
  shortcuts: ShortcutDefinition[];
  isSending: boolean;
};

const shortcutIcons = {
  open_vscode: WandSparkles,
  open_project: FolderOpen,
  new_terminal: SquareTerminal,
  run_npm_start: Play,
  open_package_json: PackageOpen,
} satisfies Record<ShortcutDefinition["id"], typeof WandSparkles>;

export function ControlPanel({
  commandInput,
  codexPrompt,
  codexAutoSubmit,
  codexReadBack,
  codexAnchorReady,
  setCommandInput,
  setCodexPrompt,
  setCodexAutoSubmit,
  setCodexReadBack,
  onSubmit,
  onSubmitCodex,
  onReadCodexReply,
  onCaptureCodexAnchor,
  onShortcut,
  shortcuts,
  isSending,
}: ControlPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.06, ease: "easeOut" }}
      className="space-y-4"
    >
      <Card className="p-5 sm:p-6" accent="cyan">
        <div className="space-y-5">
          <SectionTitle
            eyebrow={copy.control.eyebrow}
            title={copy.control.title}
            body={copy.control.body}
          />

          <TextArea
            value={commandInput}
            onChange={(event) => setCommandInput(event.target.value)}
            placeholder={copy.control.placeholder}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-white/52">{copy.control.helper}</p>
            <Button
              variant="primary"
              size="lg"
              icon={<SendHorizonal className="size-4" />}
              loading={isSending}
              onClick={() => void onSubmit()}
            >
              {isSending ? copy.control.sending : copy.control.send}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6" accent="cyan">
        <div className="space-y-5">
          <SectionTitle
            eyebrow={copy.codex.eyebrow}
            title={copy.codex.title}
            body={copy.codex.body}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-50">{copy.codex.title}</p>
            <TextArea
              className="min-h-[180px]"
              value={codexPrompt}
              onChange={(event) => setCodexPrompt(event.target.value)}
              placeholder={copy.codex.placeholder}
            />
          </div>

          <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-white/42">{copy.codex.statusLabel}</p>
              <p className="text-sm text-white/74">
                {codexAnchorReady ? copy.codex.calibrated : copy.codex.uncalibrated}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-white/76">
                <input
                  type="checkbox"
                  className="size-4 rounded border-white/20 bg-slate-950/55 text-cyan-300 focus:ring-cyan-300/40"
                  checked={codexAutoSubmit}
                  onChange={(event) => setCodexAutoSubmit(event.target.checked)}
                />
                <span>{copy.codex.autoSubmit}</span>
              </label>

              <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-white/76">
                <input
                  type="checkbox"
                  className="size-4 rounded border-white/20 bg-slate-950/55 text-cyan-300 focus:ring-cyan-300/40"
                  checked={codexReadBack}
                  disabled={!codexAutoSubmit}
                  onChange={(event) => setCodexReadBack(event.target.checked)}
                />
                <span>{copy.codex.readBack}</span>
              </label>
            </div>
          </div>

          <p className="text-sm leading-6 text-white/52">{copy.codex.helper}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <Button
              variant="primary"
              size="lg"
              icon={<SendHorizonal className="size-4" />}
              loading={isSending}
              className="w-full"
              onClick={() => void onSubmitCodex()}
            >
              {isSending ? copy.codex.sending : copy.codex.send}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              icon={<Crosshair className="size-4" />}
              className="w-full"
              onClick={() => void onCaptureCodexAnchor()}
            >
              {copy.codex.capture}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => void onReadCodexReply()}
            >
              {copy.codex.readNow}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6" accent="violet">
        <div className="space-y-4">
          <SectionTitle
            eyebrow={copy.control.quickEyebrow}
            title={copy.control.quickTitle}
            body={copy.control.quickBody}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {shortcuts.map((shortcut) => {
              const Icon = shortcutIcons[shortcut.id];
              return (
                <button
                  key={shortcut.id}
                  type="button"
                  onClick={() => void onShortcut(shortcut.id)}
                  className="group rounded-[24px] border border-white/10 bg-white/6 p-4 text-left transition hover:border-cyan-300/25 hover:bg-white/8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-3 inline-flex rounded-2xl border border-white/10 bg-slate-950/45 p-2 text-cyan-100/80">
                        <Icon className="size-4" />
                      </div>
                      <p className="text-base font-medium text-slate-50">{shortcut.label}</p>
                      <p className="mt-2 text-sm leading-6 text-white/54">{shortcut.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
