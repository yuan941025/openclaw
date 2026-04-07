import { copy } from "../../app/copy";

export function SiteFooter() {
  return (
    <footer className="surface-card brand-tint brand-ring mt-2 px-6 py-5 md:px-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-base font-semibold text-ink">{copy.footer.title}</p>
          <p className="mt-2 text-sm leading-6 text-mist">{copy.footer.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-700">
          <a href="#/privacy" className="transition hover:text-accent">
            {copy.footer.privacy}
          </a>
          <a href="#/terms" className="transition hover:text-accent">
            {copy.footer.terms}
          </a>
          <a href="#/contact" className="transition hover:text-accent">
            {copy.footer.contact}
          </a>
        </div>
      </div>

      <div className="mt-4 border-t border-white/70 pt-4 text-sm text-mist">{copy.footer.copyright}</div>
    </footer>
  );
}
