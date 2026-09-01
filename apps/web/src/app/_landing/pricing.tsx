'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

interface PricingPlan {
  name: string;
  price: number;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for individuals and small teams',
    features: [
      'Up to 5 campaigns',
      'AI content generation',
      'Basic Kanban board',
      'Email support',
      'PDF export',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    price: 79,
    description: 'For growing marketing teams',
    features: [
      'Unlimited campaigns',
      'Advanced AI content generation',
      'Full Kanban board with custom columns',
      'AI chat assistant',
      'Team collaboration',
      'Priority support',
      'Advanced analytics',
      'PDF & CSV export',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 0,
    description: 'Custom solutions for large organizations',
    features: [
      'Everything in Professional',
      'Custom integrations',
      'Dedicated account manager',
      'Advanced security & compliance',
      'SLA guarantee',
      'White-label options',
      'API access',
    ],
    cta: 'Contact Sales',
  },
];

export function PricingSection() {
  const router = useRouter();

  const handleCta = (planName: string) => {
    if (planName === 'Enterprise') {
      // In a real app, this would open a contact form or sales contact page
      router.push('/login');
    } else {
      router.push('/signup');
    }
  };

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Choose the perfect plan for your team. All plans include a 14-day free trial — no credit card required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative ${plan.highlighted ? 'md:scale-105' : ''}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <Card
                className={`h-full flex flex-col ${
                  plan.highlighted ? 'border-primary shadow-lg' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="mb-2">{plan.name}</CardTitle>
                  <p className="text-sm text-foreground/70 mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <p className="text-lg text-foreground/70">Custom pricing</p>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-foreground/60">/month</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/80">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                    onClick={() => handleCta(plan.name)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
          <p className="text-foreground/70 mb-4">
            All plans include essential features like campaign management, AI content generation, Kanban board, and team collaboration.
          </p>
          <p className="text-sm text-foreground/60">
            Questions about pricing? <button className="text-primary hover:underline font-medium">Contact our sales team</button>
          </p>
        </div>
      </div>
    </section>
  );
}
