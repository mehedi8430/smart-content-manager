"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRef } from "react";
import { TypeTabs } from "./type-tabs";
import {
  useAiGenerator,
  ToneType,
  LengthType,
} from "@/providers/ai-generator-provider";
import { streamGeneration } from "@/lib/ai-stream-client";

export function GeneratorForm({ campaignId }: { campaignId: string }) {
  const {
    state,
    setPrompt,
    setTone,
    setLength,
    setKeywords,
    startGeneration,
    appendChunk,
    completeGeneration,
    setError,
  } = useAiGenerator();

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerate = () => {
    // Convert keywords from comma-separated string to string[]
    const keywordsArray = state.keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // Convert UI types to API types
    const typeMap: Record<typeof state.activeType, "ad" | "caption" | "email"> =
      {
        Ad: "ad",
        Caption: "caption",
        Email: "email",
      };

    const lengthMap: Record<typeof state.length, "short" | "medium" | "long"> =
      {
        Short: "short",
        Medium: "medium",
        Long: "long",
      };

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    // Start generation state
    startGeneration();

    // Call the streaming API
    streamGeneration(
      campaignId,
      {
        type: typeMap[state.activeType],
        prompt: state.prompt,
        tone: state.tone,
        keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
        length: lengthMap[state.length],
      },
      {
        onChunk: (text) => appendChunk(text),
        onDone: (output) => completeGeneration(output),
        onError: (message) => setError(message),
      },
      abortControllerRef.current.signal,
    );
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setError("Generation cancelled");
  };

  return (
    <div className="space-y-6">
      <TypeTabs />

      <div className="space-y-2">
        <Label htmlFor="prompt">What should this be about?</Label>
        <Textarea
          id="prompt"
          placeholder="Describe what you want to generate..."
          value={state.prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <Label htmlFor="tone">Tone</Label>
        <Select
          value={state.tone}
          onValueChange={(value) => setTone(value as ToneType)}
        >
          <SelectTrigger id="tone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Professional">Professional</SelectItem>
            <SelectItem value="Playful">Playful</SelectItem>
            <SelectItem value="Urgent">Urgent</SelectItem>
            <SelectItem value="Friendly">Friendly</SelectItem>
            <SelectItem value="Bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Length */}
      <div className="space-y-2">
        <Label htmlFor="length">Length</Label>
        <Select
          value={state.length}
          onValueChange={(value) => setLength(value as LengthType)}
        >
          <SelectTrigger id="length">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Short">Short</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Long">Long</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">Keywords (optional)</Label>
        <Input
          id="keywords"
          placeholder="keyword1, keyword2, keyword3"
          value={state.keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Separate multiple keywords with commas
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleGenerate}
          disabled={state.isGenerating || !state.prompt.trim()}
          className="flex-1"
        >
          {state.isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate"
          )}
        </Button>
        {state.isGenerating && (
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={!state.isGenerating}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
