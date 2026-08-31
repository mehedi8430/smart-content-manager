'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Screenshot {
  title: string;
  description: string;
  image: string;
  alt: string;
}

const screenshots: Screenshot[] = [
  {
    title: 'Campaign Dashboard',
    description: 'Manage all your campaigns in one centralized dashboard with real-time updates and performance metrics.',
    image: '/dashboard/dashboard.png',
    alt: 'Campaign Dashboard',
  },
  {
    title: 'AI Content Generator',
    description: 'Generate high-quality marketing copy and content instantly with advanced AI-powered tools.',
    image: '/dashboard/ai-output.png',
    alt: 'AI Content Generator',
  },
  {
    title: 'Kanban Board',
    description: 'Organize your workflow with a visual Kanban board for seamless task management.',
    image: '/dashboard/kanban-board.png',
    alt: 'Kanban Board',
  },
  {
    title: 'AI Chat Assistant',
    description: 'Get instant support and recommendations from our intelligent AI chat assistant.',
    image: '/dashboard/chat-assistant.png',
    alt: 'AI Chat Assistant',
  },
];

export function ScreenshotsGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    if (!autoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % screenshots.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay]);

  const handlePrevious = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  const handleNext = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
  };

  const goToSlide = (index: number) => {
    setAutoPlay(false);
    setCurrentIndex(index);
  };

  const currentScreenshot = screenshots[currentIndex];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            See It In Action
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Explore the powerful features that make Smart Content Manager the ultimate marketing platform.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Main Image */}
          <Card className="overflow-hidden border border-border/40 group">
            <div className="relative w-full h-96 sm:h-125 lg:h-150">
              <Image
                src={currentScreenshot.image}
                alt={currentScreenshot.alt}
                fill
                className="object-cover transition-opacity duration-500"
                priority
              />
              {/* Gradient overlay for text visibility */}
              <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </Card>

          {/* Navigation Buttons */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all duration-300 hidden sm:flex items-center justify-center"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all duration-300 hidden sm:flex items-center justify-center"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Info Section Below Image */}
          <div className="mt-8 text-center">
            <h3 className="text-3xl font-bold mb-3">{currentScreenshot.title}</h3>
            <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
              {currentScreenshot.description}
            </p>

            {/* Dot Indicators */}
            <div className="flex justify-center items-center gap-3 mb-8">
              {screenshots.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentIndex
                      ? 'w-3 h-3 bg-primary'
                      : 'w-2 h-2 bg-primary/40 hover:bg-primary/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Slide Counter */}
            <div className="text-sm text-foreground/50">
              {currentIndex + 1} / {screenshots.length}
            </div>
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="flex gap-3 justify-center mt-8 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {screenshots.map((screenshot, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`p-4 rounded-lg border-2 transition-all duration-300 text-left cursor-pointer ${
                index === currentIndex
                  ? 'border-primary bg-primary/10'
                  : 'border-border/40 hover:border-primary/50'
              }`}
            >
              <div className="text-sm font-semibold mb-1">{screenshot.title}</div>
              <div className="text-xs text-foreground/60">
                {screenshot.description.substring(0, 50)}...
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
