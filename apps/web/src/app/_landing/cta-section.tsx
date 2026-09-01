'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
  const router = useRouter();

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why Choose Smart Content Manager?
          </h2>
          <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
            We've combined the best marketing tools into one intuitive platform. Trusted by marketing teams and small businesses worldwide to save time, reduce costs, and create better campaigns.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <p className="text-sm text-foreground/70">Active Users</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">10k+</div>
              <p className="text-sm text-foreground/70">Campaigns Created</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">98%</div>
              <p className="text-sm text-foreground/70">Satisfaction Rate</p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => router.push('/signup')}
            className="gap-2"
          >
            Start Your Free Trial
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
