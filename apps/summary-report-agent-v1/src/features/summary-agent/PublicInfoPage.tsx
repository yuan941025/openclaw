import { copy } from "../../app/copy";
import { Card } from "../../components/ui/Card";
import { EarlyAccessSection } from "./EarlyAccessSection";
import { SiteFooter } from "./SiteFooter";

type LegalPageKey = "privacy" | "terms" | "contact";

type PublicInfoPageProps = {
  page: LegalPageKey;
};

export function PublicInfoPage({ page }: PublicInfoPageProps) {
  const content = copy.legal[page];

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:gap-8">
        <Card className="hero-panel brand-ring overflow-hidden p-6 md:p-8">
          <a href="#/" className="text-sm font-medium text-accent transition hover:opacity-80">
            {copy.legal.backHome}
          </a>

          <div className="mt-5 max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">{content.eyebrow}</p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">{content.title}</h1>
            <p className="mt-4 text-base leading-8 text-mist">{content.intro}</p>
          </div>
        </Card>

        {"sections" in content ? (
          <div className="grid gap-4">
            {content.sections.map((section) => (
              <Card key={section.title} className="brand-tint brand-ring p-6 md:p-7">
                <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-mist">{section.body}</p>
              </Card>
            ))}
          </div>
        ) : (
          <EarlyAccessSection compact />
        )}

        <SiteFooter />
      </div>
    </main>
  );
}
