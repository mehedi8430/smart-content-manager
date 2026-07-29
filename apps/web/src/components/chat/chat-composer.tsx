"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatComposerProps {
  isStreaming: boolean;
  onSend: (content: string) => void;
  onCancel: () => void;
  sessionId?: string | null;
}

export function ChatComposer({
  isStreaming,
  onSend,
  onCancel,
  sessionId,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [sessionId]);

  const submit = () => {
    const content = value.trim();
    if (!content || isStreaming) return;
    onSend(content);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="shrink-0 border-t border-border bg-background/80 p-3 backdrop-blur">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message the copilot…"
          disabled={isStreaming}
          className="max-h-40 min-h-10 flex-1 resize-none"
          rows={1}
        />
        {isStreaming ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onCancel}
            aria-label="Stop generating"
            className="shrink-0"
          >
            <Square className="size-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={!value.trim()}
            aria-label="Send message"
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        )}
      </div>
      <p className="mt-1.5 px-1 text-xs text-muted-foreground">
        Enter to send · Shift+Enter for a new line
      </p>
    </div>
  );
}
