import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../styles/cn";

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full resize-none rounded-[28px] border border-white/10 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-50 outline-none transition focus:border-cyan-300/30 focus:bg-slate-950/70 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)] placeholder:text-white/28",
        className,
      )}
      {...props}
    />
  );
}
