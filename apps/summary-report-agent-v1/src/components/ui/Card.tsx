import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

type CardProps = PropsWithChildren<
  {
    className?: string;
  } & ComponentPropsWithoutRef<"section">
>;

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <section className={`surface-card ${className}`} {...props}>
      {children}
    </section>
  );
}
