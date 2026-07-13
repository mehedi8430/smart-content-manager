"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Check, Copy, Trash2 } from "lucide-react";
import { AiOutput } from "@/types/ai-output.type";

interface OutputCardProps {
  output: AiOutput;
  copiedId: string | null;
  onCopy: (content: string, id: string) => void;
  onUseInPost: (content: string) => void;
  onDelete: (id: string) => void;
}

export default function OutputCard({
  output,
  copiedId,
  onCopy,
  onUseInPost,
  onDelete,
}: OutputCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize">
                {output.type}
              </Badge>
              {output.tone && (
                <Badge variant="outline" className="capitalize">
                  {output.tone}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(output.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {output.content}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={() => onCopy(output.content, output.id)}
              variant="ghost"
              size="sm"
              className="cursor-pointer"
            >
              {copiedId === output.id ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={() => onUseInPost(output.content)}
              variant="ghost"
              size="sm"
              className="cursor-pointer"
            >
              Use in Post
            </Button>
            <Button
              onClick={() => onDelete(output.id)}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
