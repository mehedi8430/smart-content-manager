"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface ChatWelcomeProps {
  onQuickAction?: (action: string) => void;
}

export function ChatWelcome({ onQuickAction }: ChatWelcomeProps) {
  const quickActions = [
    "Help me make a decision",
    "Get more perspectives on a topic",
    "What kinds of questions can I ask?",
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary">
          <MessageCircle className="size-8" />
        </div>
        
        <div className="max-w-sm space-y-2">
          <h1 className="text-2xl font-semibold">Hello, Mehedi</h1>
          <p className="text-base text-muted-foreground">
            How can I help you today?
          </p>
        </div>

        <div className="w-full max-w-sm space-y-2">
          {quickActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              className="w-full justify-start text-left text-sm"
              onClick={() => onQuickAction?.(action)}
            >
              {action}
            </Button>
          ))}
        </div>

        <div className="mt-4 space-y-1 text-xs text-muted-foreground">
          <p>Type / to use skills</p>
        </div>
      </div>
    </div>
  );
}
