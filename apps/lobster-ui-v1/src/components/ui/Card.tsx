import type { HTMLAttributes } from "react";
import { cn } from "../../styles/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  accent?: "cyan" | "violet" | "rose" | "neutral";
};

const accentClasses: Record<NonNullable<CardProps["accent"]>, string> = {
  cyan: "before:bg-cyan-300/20",
  violet: "before:bg-violet-300/18",
  rose: "before:bg-rose-300/18",
  neutral: "before:bg-white/6",
};

export function Card({ className, accent = "neutral", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden before:absolute before:inset-x-6 before:top-0 before:h-px before:blur-sm",
        accentClasses[accent],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
