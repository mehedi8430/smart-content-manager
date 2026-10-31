'use client';

import { useEffect, useRef, useState, type ComponentProps } from 'react';

import { cn } from '@/lib/utils';

interface ScrollRevealProps extends ComponentProps<'div'> {
  /** Delay in milliseconds before the reveal transition starts. */
  delay?: number;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  style,
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'scroll-reveal transition-[opacity,translate] duration-700 ease-out will-change-[opacity,translate] motion-reduce:transition-none',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className,
      )}
      style={{ ...style, transitionDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}
