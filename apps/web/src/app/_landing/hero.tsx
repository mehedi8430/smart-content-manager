'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Brand gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 opacity-30 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-96 w-96 rounded-full bg-primary/10 opacity-20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-cyan-400/10 opacity-20 blur-3xl dark:bg-cyan-300/10" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-primary/20 bg-primary/5">
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
              className="gap-2 shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/login')}
              className="hover:border-primary/40 hover:text-primary"
            >
              Sign In
            </Button>
          </div>

          <p className="text-sm text-foreground/60">
            No credit card required. Start creating in seconds.
          </p>

        {/* Product preview — looping promo video */}
          <div className="mt-16 relative rounded-xl border border-primary/15 bg-primary/5 overflow-hidden shadow-2xl shadow-primary/10 ring-1 ring-primary/10">
            <div className="aspect-video">
              <video
                src="/promo/smart-content-manager-promo.mp4"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Smart Content Manager product preview"
                className="w-full h-full"
              />
            </div>
          </div>
      </div>
    </section>
  );
}
