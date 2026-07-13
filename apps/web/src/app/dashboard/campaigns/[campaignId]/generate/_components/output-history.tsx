"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText } from "lucide-react";
import { AiOutput } from "@/types/ai-output.type";
import {
  listAiOutputsAction,
  deleteAiOutputAction,
} from "@/actions/ai-output.actions";
import { useAiGenerator } from "@/providers/ai-generator-provider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import OutputCard from "./output-card";

interface OutputHistoryProps {
  campaignId: string;
}

export function OutputHistory({ campaignId }: OutputHistoryProps) {
  const router = useRouter();
  const { state } = useAiGenerator();
  const [outputs, setOutputs] = useState<AiOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const loadOutputs = useCallback(async () => {
    setLoading(true);

    try {
      const result = await listAiOutputsAction(campaignId);

      if (result.success && result.data) {
        setOutputs(result.data);
      }
    } catch (error) {
      console.error("Failed to load outputs:", error);
      toast.error("Failed to load output history");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const lastCompletedId = useRef<string | null>(null);

  // Refetch the list whenever a new AI output is generated/regenerated
  useEffect(() => {
    const completedId = state.completedOutput?.id ?? null;
    if (completedId && completedId !== lastCompletedId.current) {
      lastCompletedId.current = completedId;
      loadOutputs();
    }
  }, [state.completedOutput, loadOutputs]);

  useEffect(() => {
    loadOutputs();
  }, [campaignId]);

  const handleUseInPost = (content: string) => {
    const params = new URLSearchParams({ content });
    router.push(
      `/dashboard/campaigns/${campaignId}/board?${params.toString()}`,
    );
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Content copied to clipboard");
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleDelete = async (id: string) => {
    // Optimistic removal
    setOutputs((prev) => prev.filter((output) => output.id !== id));

    try {
      const result = await deleteAiOutputAction(campaignId, id);
      if (result.success) {
        toast.success(result.message || "Output deleted");
      } else {
        // Revert on failure
        loadOutputs();
        toast.error("Failed to delete output");
      }
    } catch (error) {
      console.error("Failed to delete output:", error);
      loadOutputs();
      toast.error("Failed to delete output");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    await handleDelete(pendingDeleteId);
    setPendingDeleteId(null);
  };

  // Group outputs by type
  const groupedOutputs = outputs.reduce(
    (acc, output) => {
      const type = output.type || "other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(output);
      return acc;
    },
    {} as Record<string, AiOutput[]>,
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (outputs.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No generated content yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your generated content history will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedOutputs).map(([type, items]) => (
        <div key={type}>
          <h3 className="text-lg font-semibold mb-3 capitalize">{type}s</h3>
          <div className="grid gap-3">
            {items.map((output) => (
              <OutputCard
                key={output.id}
                output={output}
                copiedId={copiedId}
                onCopy={handleCopy}
                onUseInPost={handleUseInPost}
                onDelete={setPendingDeleteId}
              />
            ))}
          </div>
        </div>
      ))}

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete output?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the generated content. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="space-y-3">
            {[1, 2].map((j) => (
              <Card key={j}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
