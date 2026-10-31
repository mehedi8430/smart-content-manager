"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/providers/onboarding-provider";

interface OnboardingHintProps {
  id: string;
  children: ReactNode;
  message: string;
  side?: "top" | "bottom";
  align?: "start" | "end";
  className?: string;
  order?: number;
}

export function OnboardingHint({
  id,
  children,
  message,
  side = "bottom",
  align = "end",
  className,
  order = 0,
}: OnboardingHintProps) {
  const {
    dismiss,
    isActive,
    isLast,
    registerHint,
    remaining,
    unregisterHint,
  } = useOnboarding();
  const messageId = useId();
  const visible = isActive(id);
  const anchorRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerHint(id, order);
    return () => unregisterHint(id);
  }, [id, order, registerHint, unregisterHint]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss(id);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismiss, id, visible]);

  const positionCard = useCallback(() => {
    const wrapper = anchorRef.current;
    const card = cardRef.current;
    if (!wrapper || !card) return;

    const anchor =
      (wrapper.firstElementChild as HTMLElement | null) ?? wrapper;
    const anchorRect = anchor.getBoundingClientRect();
    const cardWidth = card.offsetWidth;
    const cardHeight = card.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 12;
    const margin = 8;

    const spaceBelow = viewportHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    let resolvedSide = side;

    if (
      side === "bottom" &&
      spaceBelow < cardHeight + gap + margin &&
      spaceAbove > spaceBelow
    ) {
      resolvedSide = "top";
    } else if (
      side === "top" &&
      spaceAbove < cardHeight + gap + margin &&
      spaceBelow > spaceAbove
    ) {
      resolvedSide = "bottom";
    }

    let top =
      resolvedSide === "bottom"
        ? anchorRect.bottom + gap
        : anchorRect.top - cardHeight - gap;
    top = Math.max(
      margin,
      Math.min(top, viewportHeight - cardHeight - margin),
    );

    let left =
      align === "end" ? anchorRect.right - cardWidth : anchorRect.left;
    left = Math.max(
      margin,
      Math.min(left, viewportWidth - cardWidth - margin),
    );

    const anchorCenter = anchorRect.left + anchorRect.width / 2;
    const arrowLeft = Math.max(
      16,
      Math.min(anchorCenter - left, cardWidth - 16),
    );

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.visibility = "visible";
    card.dataset.side = resolvedSide;
    card.style.setProperty("--tip-arrow-left", `${arrowLeft}px`);
  }, [align, side]);

  useEffect(() => {
    if (!visible) return;

    const wrapper = anchorRef.current;
    const card = cardRef.current;
    if (!wrapper || !card) return;

    positionCard();

    const handlePosition = () => positionCard();
    const anchor =
      (wrapper.firstElementChild as HTMLElement | null) ?? wrapper;
    const resizeObserver = new ResizeObserver(handlePosition);

    resizeObserver.observe(anchor);
    resizeObserver.observe(card);
    window.addEventListener("resize", handlePosition);
    window.addEventListener("scroll", handlePosition, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handlePosition);
      window.removeEventListener("scroll", handlePosition, true);
    };
  }, [positionCard, visible]);

  const close = () => dismiss(id);

  const tip = visible ? (
    <div
      ref={cardRef}
      role="dialog"
      aria-label="Onboarding tip"
      aria-describedby={messageId}
      style={{ visibility: "hidden" }}
      className={`group fixed z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-sidebar-primary-foreground/15 bg-sidebar-primary p-4 text-left text-sidebar-primary-foreground shadow-2xl shadow-sidebar-primary/40 ring-1 ring-sidebar-primary-foreground/10 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-300 ${
        side === "top"
          ? "motion-safe:slide-in-from-bottom-2"
          : "motion-safe:slide-in-from-top-2"
      }`}
    >
      <span
        aria-hidden="true"
        style={{ left: "var(--tip-arrow-left, 2rem)" }}
        className="absolute size-4 -translate-x-1/2 rotate-45 rounded-[2px] bg-sidebar-primary group-data-[side=top]:-bottom-2 group-data-[side=bottom]:-top-2"
      />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary-foreground/15">
          <Sparkles className="size-3.5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full rounded-full bg-sidebar-primary-foreground opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex size-1.5 rounded-full bg-sidebar-primary-foreground" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Quick tip
            </span>
          </div>
          <p
            id={messageId}
            className="mt-1.5 text-sm font-medium leading-relaxed"
          >
            {message}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={close}
          className="-mr-1 -mt-1 shrink-0 text-sidebar-primary-foreground/80 hover:bg-sidebar-primary-foreground/15 hover:text-sidebar-primary-foreground"
          aria-label="Dismiss hint"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-sidebar-primary-foreground/20 pt-3">
        <span className="text-[11px] font-medium">
          {isLast ? "Last tip" : `${remaining} tips left`}
        </span>
        <Button
          type="button"
          size="sm"
          onClick={close}
          className="bg-sidebar-primary-foreground text-sidebar-primary hover:bg-sidebar-primary-foreground/90"
        >
          {isLast ? "Done" : "Next"}
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={anchorRef} className={`relative inline-flex ${className ?? ""}`}>
      {children}
      {tip}
    </div>
  );
}
