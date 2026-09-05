import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export interface LegalSection {
  heading?: string;
  paragraphs: string[];
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to home
          </Link>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-foreground/60">Last updated: {updated}</p>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-foreground/80 leading-relaxed mb-10">{intro}</p>

        <div className="space-y-10">
          {sections.map((section, index) => (
            <section key={index}>
              {section.heading && (
                <h2 className="text-xl font-semibold mb-3 text-foreground">{section.heading}</h2>
              )}
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-sm text-foreground/70 leading-relaxed mb-3">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-12 text-xs text-foreground/50 leading-relaxed">
          If you have any questions about these policies, contact us at support@smartcontentmanager.com.
        </p>
      </article>
    </main>
  );
}
