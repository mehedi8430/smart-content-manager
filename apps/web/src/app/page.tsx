import { Metadata } from 'next';
import { LandingNavigation } from './_landing/navigation';
import { HeroSection } from './_landing/hero';
import { FeaturesSection } from './_landing/features';
import { ScreenshotsGallery } from './_landing/screenshots-gallery';
import { CtaSection } from './_landing/cta-section';
import { PricingSection } from './_landing/pricing';
import { Footer } from './_landing/footer';

export const metadata: Metadata = {
  title: 'Smart Content & Campaign Manager - AI-Powered Marketing Platform',
  description:
    'All-in-one platform for marketers and small businesses. Create campaigns, generate AI content, manage tasks with Kanban board, chat with AI assistant, and export to PDF. Start free today.',
  openGraph: {
    title: 'Smart Content & Campaign Manager - AI-Powered Marketing Platform',
    description:
      'All-in-one platform for marketers and small businesses. Create campaigns, generate AI content, manage tasks with Kanban board, chat with AI assistant, and export to PDF. Start free today.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Content & Campaign Manager',
    description:
      'Create campaigns, generate AI content, and manage your entire marketing workflow in one place.',
  },
  keywords: [
    'campaign management',
    'AI content generation',
    'marketing platform',
    'kanban board',
    'content marketing',
    'SaaS',
    'team collaboration',
  ],
};

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      <LandingNavigation />
      <HeroSection />
      <FeaturesSection />
      {/* <ScreenshotsGallery /> */}
      <CtaSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
