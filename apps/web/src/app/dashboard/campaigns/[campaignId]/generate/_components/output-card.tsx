"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { Check, Copy, Download, MoreVertical, Trash2 } from "lucide-react";
import { AiOutput } from "@/types/ai-output.type";

interface OutputCardProps {
  output: AiOutput;
  copiedId: string | null;
  onCopy: (content: string, id: string) => void;
  onExport: (output: AiOutput) => void;
  onUseInPost: (content: string) => void;
  onDelete: (id: string) => void;
}

export default function OutputCard({
  output,
  copiedId,
  onCopy,
  onExport,
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

          {/* Action Buttons */}
          <div className="flex gap-2 shrink-0 justify-end">
            <div className="hidden md:flex gap-2 flex-wrap justify-end">
              <Button
                onClick={() => onCopy(output.content, output.id)}
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                aria-label="Copy content"
              >
                {copiedId === output.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => onExport(output)}
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                aria-label="Export PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onUseInPost(output.content)}
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                aria-label="Use in post"
              >
                Use in Post
              </Button>
              <Button
                onClick={() => onDelete(output.id)}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive cursor-pointer"
                aria-label="Delete output"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden cursor-pointer"
                  aria-label="More actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onCopy(output.content, output.id)}
                  className="gap-2"
                >
                  {copiedId === output.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onExport(output)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUseInPost(output.content)}
                  className="gap-2"
                >
                  Use in Post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(output.id)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
