"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const storageKey = "smart-content-manager-onboarding";

interface RegisteredHint {
  id: string;
  order: number;
}

interface OnboardingContextValue {
  hasSeen: (hintId: string) => boolean;
  dismiss: (hintId: string) => void;
  isActive: (hintId: string) => boolean;
  registerHint: (hintId: string, order?: number) => void;
  unregisterHint: (hintId: string) => void;
  remaining: number;
  isLast: boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

function parseStoredHints(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((hint): hint is string => typeof hint === "string")
      : [];
  } catch {
    return [];
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [seenHints, setSeenHints] = useState<string[]>([]);
  const [registeredHints, setRegisteredHints] = useState<RegisteredHint[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setSeenHints(parseStoredHints(window.localStorage.getItem(storageKey)));
      } catch {
        // Onboarding is optional; blocked storage falls back to an in-memory tour.
      } finally {
        setHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      setSeenHints(parseStoredHints(event.newValue));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const registerHint = useCallback((hintId: string, order = 0) => {
    setRegisteredHints((current) => {
      const existing = current.find((hint) => hint.id === hintId);
      if (!existing) return [...current, { id: hintId, order }];
      if (existing.order === order) return current;
      return current.map((hint) =>
        hint.id === hintId ? { ...hint, order } : hint,
      );
    });
  }, []);

  const unregisterHint = useCallback((hintId: string) => {
    setRegisteredHints((current) =>
      current.filter((hint) => hint.id !== hintId),
    );
  }, []);

  const dismiss = useCallback((hintId: string) => {
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
  }, []);

  const orderedHints = useMemo(
    () => [...registeredHints].sort((a, b) => a.order - b.order),
    [registeredHints],
  );

  const unseenHints = useMemo(
    () => orderedHints.filter((hint) => !seenHints.includes(hint.id)),
    [orderedHints, seenHints],
  );

  const activeHintId = hydrated ? (unseenHints[0]?.id ?? null) : null;
  const remaining = unseenHints.length;
  const isLast = activeHintId !== null && remaining === 1;

  const hasSeen = useCallback(
    (hintId: string) => seenHints.includes(hintId),
    [seenHints],
  );

  const isActive = useCallback(
    (hintId: string) => activeHintId === hintId,
    [activeHintId],
  );

  const value = useMemo<OnboardingContextValue>(
    () => ({
      hasSeen,
      dismiss,
      isActive,
      registerHint,
      unregisterHint,
      remaining,
      isLast,
    }),
    [
      hasSeen,
      dismiss,
      isActive,
      registerHint,
      unregisterHint,
      remaining,
      isLast,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
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
