import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../styles/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "border border-cyan-400/30 bg-cyan-300/15 text-slate-50 shadow-[0_20px_50px_rgba(20,207,255,0.18)] hover:border-cyan-300/60 hover:bg-cyan-300/20 active:scale-[0.985]",
  secondary:
    "border border-white/12 bg-white/6 text-slate-100 hover:border-white/20 hover:bg-white/10 active:scale-[0.985]",
  ghost:
    "border border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/6 active:scale-[0.985]",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  md: "h-11 rounded-2xl px-4 text-sm",
  lg: "h-14 rounded-3xl px-5 text-base",
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  icon,
  loading = false,
  children,
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium tracking-[0.02em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? <span className="status-orb status-orb-cyan" /> : icon}
      <span>{children}</span>
    </button>
  );
}
