"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

const storageKey = "smart-content-manager-onboarding";

interface OnboardingContextValue {
  hasSeen: (hintId: string) => boolean;
  dismiss: (hintId: string) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [seenHints, setSeenHints] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          window.setTimeout(() => setSeenHints(parsed), 0);
        }
      }
    } catch {
      // Onboarding is optional; a blocked or malformed storage value is harmless.
    }
  }, []);

  const dismiss = (hintId: string) => {
    setSeenHints((current) => {
      if (current.includes(hintId)) return current;
      const next = [...current, hintId];
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Keep the in-memory dismissal when storage is unavailable.
      }
      return next;
    });
  };

  return (
    <OnboardingContext.Provider
      value={{ hasSeen: (hintId) => seenHints.includes(hintId), dismiss }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}