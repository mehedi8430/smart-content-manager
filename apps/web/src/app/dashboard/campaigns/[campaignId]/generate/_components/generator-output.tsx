"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, X, Check } from "lucide-react";
import { useAiGenerator } from "@/providers/ai-generator-provider";
import { toast } from "sonner";

export function GeneratorOutput() {
  const { state, reset, startGeneration } = useAiGenerator();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(state.streamedContent);
    toast.success("Content copied to clipboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRegenerate = () => {
    // TODO: Implement regenerate functionality later
    startGeneration();
  };

  const handleDiscard = () => {
    reset();
  };

  // Empty state
  if (!state.isGenerating && !state.streamedContent && !state.error) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium">
              Your generated content will appear here
            </p>
            <p className="text-sm mt-2">
              Fill in the form and click Generate to start
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (state.error) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <div className="text-destructive">
            <p className="text-lg font-medium">Error generating content</p>
            <p className="text-sm mt-2">{state.error}</p>
            <Button
              onClick={handleRegenerate}
              variant="outline"
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Streaming state
  if (state.isGenerating) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">
              {state.streamedContent}
              <span className="inline-block w-2 h-4 bg-foreground ml-1 animate-pulse" />
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Completed state
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="prose prose-sm max-w-none mb-6">
          <p className="whitespace-pre-wrap">{state.streamedContent}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button onClick={handleRegenerate} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <Button onClick={handleDiscard} variant="ghost" size="sm">
            <X className="h-4 w-4 mr-2" />
            Discard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
