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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TypeTabs } from "./type-tabs";
import { useAiGenerator } from "@/providers/ai-generator-provider";
import { streamGeneration } from "@/lib/ai-stream-client";
import { useAiOutputCache } from "@/hooks/server-state/useAiOutputs";

const formSchema = z.object({
  type: z.enum(["Ad", "Caption", "Email"]),
  prompt: z.string().min(1, "Prompt is required"),
  tone: z.string().optional(),
  length: z.string().optional(),
  keywords: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function GeneratorForm({ campaignId }: { campaignId: string }) {
  const { state, startGeneration, appendChunk, completeGeneration, setError } =
    useAiGenerator();
  const { upsertOutputToCache } = useAiOutputCache();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "Ad",
      prompt: "",
      tone: "Professional",
      length: "Medium",
      keywords: "",
    },
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerate = (values: FormValues) => {
    // Convert keywords from comma-separated string to string[]
    const keywordsArray = values.keywords
      ? values.keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0)
      : [];

    // Convert UI types to API types
    const typeMap: Record<typeof values.type, "ad" | "caption" | "email"> = {
      Ad: "ad",
      Caption: "caption",
      Email: "email",
    };

    const lengthMap: Record<string, "short" | "medium" | "long"> = {
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
        type: typeMap[values.type],
        prompt: values.prompt,
        tone: values.tone,
        keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
        length: lengthMap[values.length as "Short" | "Medium" | "Long"],
      },
      {
        onChunk: (text) => appendChunk(text),
        onDone: (output) => {
          completeGeneration(output);
          // Update the React Query cache immediately so the history updates without a refetch.
          upsertOutputToCache(campaignId, output);
        },
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
    <form
      onSubmit={(e) => form.handleSubmit(handleGenerate)(e)}
      className="space-y-6"
    >
      <TypeTabs control={form.control} name="type" />

      <div className="space-y-2">
        <Label htmlFor="prompt">What should this be about?</Label>
        <Textarea
          id="prompt"
          placeholder="Describe what you want to generate..."
          {...form.register("prompt")}
          className="min-h-32"
        />
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <Label htmlFor="tone">Tone</Label>
        <Controller
          name="tone"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
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
          )}
        />
      </div>

      {/* Length */}
      <div className="space-y-2">
        <Label htmlFor="length">Length</Label>
        <Controller
          name="length"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="length">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Short">Short</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Long">Long</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">Keywords (optional)</Label>
        <Input
          id="keywords"
          placeholder="keyword1, keyword2, keyword3"
          {...form.register("keywords")}
        />
        <p className="text-xs text-muted-foreground">
          Separate multiple keywords with commas
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={state.isGenerating} className="flex-1">
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
            type="button"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
