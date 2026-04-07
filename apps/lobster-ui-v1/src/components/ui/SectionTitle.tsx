type SectionTitleProps = {
  eyebrow: string;
  title: string;
  body: string;
};

export function SectionTitle({ eyebrow, title, body }: SectionTitleProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">{eyebrow}</p>
      <div>
        <h2 className="text-xl font-semibold tracking-[0.01em] text-slate-50">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-white/58">{body}</p>
      </div>
    </div>
  );
}
