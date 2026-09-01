'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-10" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-border/50 bg-muted/30">
          <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-medium">AI-Powered Marketing Tools</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
          Manage Campaigns & Create Content
          <span className="block text-primary mt-2">Powered by AI</span>
        </h1>

        <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed">
          Smart Content & Campaign Manager is an all-in-one platform for marketing teams and small businesses. Create campaigns, generate AI content, organize tasks on a Kanban board, chat with your AI assistant, and export to PDF — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            size="lg"
            onClick={() => router.push('/signup')}
            className="gap-2"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/login')}
          >
            Sign In
          </Button>
        </div>

        <p className="text-sm text-foreground/60">
          No credit card required. Start creating in seconds.
        </p>

        {/* Hero Image Placeholder */}
        <div className="mt-16 relative rounded-xl border border-border/40 bg-muted/30 overflow-hidden">
          <div className="aspect-video bg-linear-to-br from-primary/5 to-primary/10 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-foreground/50 font-medium">Smart Content Dashboard Preview</p>
              <p className="text-sm text-foreground/40 mt-2">Campaigns • Kanban • AI Content • Chat • Export</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
