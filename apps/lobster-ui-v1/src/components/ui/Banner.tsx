import { AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "../../styles/cn";

type BannerProps = {
  tone?: "warning" | "info";
  title: string;
  body: string;
};

export function Banner({ tone = "info", title, body }: BannerProps) {
  const Icon = tone === "warning" ? AlertTriangle : Sparkles;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-3xl border px-4 py-3 backdrop-blur-xl",
        tone === "warning"
          ? "border-amber-300/25 bg-amber-300/10 text-amber-50"
          : "border-cyan-300/20 bg-cyan-300/10 text-cyan-50",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-white/70">{body}</p>
      </div>
    </div>
  );
}
