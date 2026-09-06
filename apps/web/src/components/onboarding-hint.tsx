"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/providers/onboarding-provider";

interface OnboardingHintProps {
  id: string;
  children: ReactNode;
  message: string;
  side?: "top" | "bottom";
  align?: "start" | "end";
  className?: string;
}

export function OnboardingHint({
  id,
  children,
  message,
  side = "bottom",
  align = "end",
  className,
}: OnboardingHintProps) {
  const { hasSeen, dismiss } = useOnboarding();
  const visible = !hasSeen(id);

  const close = () => {
    dismiss(id);
  };

  return (
    <div className={`relative inline-flex ${className ?? ""}`}>
      {children}
      {visible ? (
        <div
          role="status"
          className={`absolute z-40 w-64 max-w-[calc(100vw-1rem)] rounded-lg border border-sidebar-primary/30 bg-popover p-3 text-left text-xs text-popover-foreground shadow-lg ${
            align === "start" ? "left-0" : "right-0"
          } ${
            side === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="flex items-start gap-2">
            <p className="flex-1 leading-relaxed">{message}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={close}
              className="-mr-1 -mt-1 shrink-0"
              aria-label="Dismiss hint"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}