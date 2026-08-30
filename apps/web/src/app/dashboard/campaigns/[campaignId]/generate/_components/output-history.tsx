"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  useAiOutputsList,
  useDeleteAiOutput,
} from "@/hooks/server-state/useAiOutputs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import OutputCard from "./output-card";
import HistoryLoadingSkeleton from "./history-loading-skeleton";

interface OutputHistoryProps {
  campaignId: string;
}

export function OutputHistory({ campaignId }: OutputHistoryProps) {
  const router = useRouter();

  const {
    data: outputs = [],
    status,
    error,
    refetch,
  } = useAiOutputsList(campaignId);
  const deleteMutation = useDeleteAiOutput(campaignId);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleUseInPost = (content: string) => {
    const params = new URLSearchParams({ content });
    router.push(
      `/dashboard/campaigns/${campaignId}/board?${params.toString()}`,
    );
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

  const handleExport = (output: AiOutput) => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const maxTextWidth = pageWidth - margin * 2;

      const title = output.title || `${output.type} content`;
      const safeTitle = title.replace(/\s+/g, " ").trim() || "content";
      const fileName = `${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;

      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(title, margin, 60, { maxWidth: maxTextWidth });

      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      let y = 96;

      const meta = [
        `Type: ${output.type}`,
        output.tone ? `Tone: ${output.tone}` : null,
        `Created: ${new Date(output.createdAt).toLocaleString()}`,
      ].filter(Boolean) as string[];

      meta.forEach((line) => {
        doc.text(line, margin, y);
        y += 18;
      });

      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y + 6, pageWidth - margin, y + 6);
      y += 26;

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);

      const normalizedContent = (output.content || "").replace(/\r\n/g, "\n");
      const lines = doc.splitTextToSize(normalizedContent, maxTextWidth);

      lines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 16;
      });

      doc.save(fileName);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF. Please try again.");
    }
  };

  // The mutation handles the optimistic removal, rollback, toast, and server reconciliation.
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
    return <HistoryLoadingSkeleton />;
  }

  // Error: surface a retry so the user isn't stuck on a silently failing page.
  if (status === "error") {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Failed to load output history"}
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
                onExport={handleExport}
                onUseInPost={handleUseInPost}
                onDelete={setPendingDeleteId}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Delete Output History Alert Dialog */}
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
