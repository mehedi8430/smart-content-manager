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
  color: string;
}

const features: Feature[] = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Campaign Management',
    description:
      'Create, organize, and track marketing campaigns from a single dashboard. Set timelines, assign teams, and monitor performance in real-time.',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'AI Content Generation',
    description:
      'Generate high-quality marketing copy, social media posts, and email campaigns instantly using advanced AI. Customize tone and style for your brand.',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  {
    icon: <Layout className="w-6 h-6" />,
    title: 'Kanban Task Board',
    description:
      'Organize your workflow with a visual Kanban board. Drag and drop tasks across stages, assign team members, and track progress effortlessly.',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'AI Chat Assistant',
    description:
      'Get instant help with your marketing questions. Our AI assistant provides recommendations, answers queries, and helps refine your campaigns.',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'PDF Export',
    description:
      'Export your campaigns, reports, and content as beautifully formatted PDFs. Perfect for sharing with stakeholders and archiving records.',
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Lightning-Fast Performance',
    description:
      'Built for speed with real-time updates, instant content generation, and seamless collaboration. No waiting, pure productivity.',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
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
          {features.map((feature, index) => (
            <Card key={index} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
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
