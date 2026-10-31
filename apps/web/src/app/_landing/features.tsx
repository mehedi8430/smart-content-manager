'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  Sparkles,
  Layout,
  MessageCircle,
  FileText,
  Zap,
} from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Campaign Management',
    description:
      'Create, organize, and track marketing campaigns from a single dashboard. Set timelines, assign teams, and monitor performance in real-time.',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'AI Content Generation',
    description:
      'Generate high-quality marketing copy, social media posts, and email campaigns instantly using advanced AI. Customize tone and style for your brand.',
  },
  {
    icon: <Layout className="w-6 h-6" />,
    title: 'Kanban Task Board',
    description:
      'Organize your workflow with a visual Kanban board. Drag and drop tasks across stages, assign team members, and track progress effortlessly.',
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'AI Chat Assistant',
    description:
      'Get instant help with your marketing questions. Our AI assistant provides recommendations, answers queries, and helps refine your campaigns.',
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'PDF Export',
    description:
      'Export your campaigns, reports, and content as beautifully formatted PDFs. Perfect for sharing with stakeholders and archiving records.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Lightning-Fast Performance',
    description:
      'Built for speed with real-time updates, instant content generation, and seamless collaboration. No waiting, pure productivity.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              All the tools a modern marketing team needs to create campaigns, generate content, and manage workflow — in one integrated platform.
            </p>
          </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
              <Card key={feature.title} className="group/feature h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform duration-300 group-hover/feature:scale-110">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/70">{feature.description}</p>
                </CardContent>
              </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
