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
import { TypeTabs } from "./type-tabs";
import {
  useAiGenerator,
  ToneType,
  LengthType,
} from "@/providers/ai-generator-provider";

export function GeneratorForm() {
  const { state, setField, startGeneration } = useAiGenerator();

  const handleGenerate = () => {
    // Convert keywords from comma-separated string to string[]
    const keywordsArray = state.keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // For now, just start generation (no API call yet)
    startGeneration();

    // TODO: Later, this will trigger the API call with:
    // { type: state.activeType, prompt: state.prompt, tone: state.tone, length: state.length, keywords: keywordsArray }
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
          onChange={(e) => setField("prompt", e.target.value)}
          className="min-h-32"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tone">Tone</Label>
        <Select
          value={state.tone}
          onValueChange={(value) => setField("tone", value as ToneType)}
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

      <div className="space-y-2">
        <Label htmlFor="length">Length</Label>
        <Select
          value={state.length}
          onValueChange={(value) => setField("length", value as LengthType)}
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
          onChange={(e) => setField("keywords", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Separate multiple keywords with commas
        </p>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={state.isGenerating || !state.prompt.trim()}
        className="w-full"
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
    </div>
  );
}
