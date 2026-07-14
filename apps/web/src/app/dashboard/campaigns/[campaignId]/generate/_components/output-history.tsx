"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import { useAiOutputsList, useDeleteAiOutput } from "@/hooks/server-state/useAiOutputs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import OutputCard from "./output-card";

interface OutputHistoryProps {
  campaignId: string;
}

export function OutputHistory({ campaignId }: OutputHistoryProps) {
  const router = useRouter();

  // All data/loading/error now comes from React Query — no manual
  // useState/useEffect fetching. The query only runs once campaignId exists.
  const { data: outputs = [], status, error, refetch } = useAiOutputsList(campaignId);
  const deleteMutation = useDeleteAiOutput(campaignId);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleUseInPost = (content: string) => {
    const params = new URLSearchParams({ content });
    router.push(`/dashboard/campaigns/${campaignId}/board?${params.toString()}`);
  };

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success("Content copied to clipboard");
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err) {
      console.error(err);
      toast.error("Content copied failed, Please try again");
    }
  };

  // The mutation handles the optimistic removal, rollback, toast, and
  // server reconciliation. We only wire it to the existing confirm step.
  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteMutation.mutate(pendingDeleteId);
    setPendingDeleteId(null);
  };

  // Group outputs by type (derived from the cached list).
  const groupedOutputs = useMemo(() => {
    return outputs.reduce(
      (acc, output) => {
        const type = output.type?.toLowerCase() || "other";
        if (!acc[type]) acc[type] = [];
        acc[type].push(output);
        return acc;
      },
      {} as Record<string, AiOutput[]>,
    );
  }, [outputs]);

  // Loading: drive the skeleton off the query's own pending status.
  if (status === "pending") {
    return <LoadingSkeleton />;
  }

  // Error: surface a retry so the user isn't stuck on a silently failing page.
  if (status === "error") {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Failed to load output history"}
          </p>
          <Button
            variant="outline"
            className="mt-4 cursor-pointer"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    );
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
