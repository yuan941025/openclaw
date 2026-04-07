import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className = "", ...props }: TextAreaProps) {
  return (
    <textarea
      className={`min-h-[340px] w-full resize-none rounded-[26px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] px-5 py-4 text-base leading-7 text-ink shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_10px_24px_rgba(15,23,42,0.04)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 ${className}`}
      {...props}
    />
  );
}
