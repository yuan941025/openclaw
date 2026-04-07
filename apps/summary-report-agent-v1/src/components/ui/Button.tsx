import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
  }
>;

const variantClassName = {
  primary:
    "bg-[linear-gradient(135deg,#4f56f5_0%,#6f79ff_100%)] text-white shadow-[0_18px_34px_rgba(91,93,246,0.26)] hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(91,93,246,0.3)]",
  secondary:
    "border border-slate-200/90 bg-white/96 text-ink shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:border-[#cfd4ff] hover:bg-white",
  ghost: "bg-transparent text-[#3b46d1] hover:bg-[#eef0ff]",
};

export function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[18px] px-5 py-3.5 text-sm font-semibold tracking-[0.01em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variantClassName[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
