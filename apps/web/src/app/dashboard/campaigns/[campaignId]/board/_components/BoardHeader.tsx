"use client";

import { SearchInput } from "@/components/search-input";
import { useBoard } from "../_context/BoardContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BoardHeaderProps {
  campaignName: string;
  onNewPost: () => void;
  onFilterChange: (filter: "all" | "todo" | "in_progress" | "done") => void;
  currentFilter: "all" | "todo" | "in_progress" | "done";
}

export function BoardHeader({
  campaignName,
  onNewPost,
  onFilterChange,
  currentFilter,
}: BoardHeaderProps) {
  const { posts } = useBoard();
  const totalPosts = posts.length;

  const filterOptions = [
    { value: "all" as const, label: "All" },
    { value: "todo" as const, label: "To Do" },
    { value: "in_progress" as const, label: "In Progress" },
    { value: "done" as const, label: "Done" },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Total Count */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{campaignName}</h1>
          <p className="text-muted-foreground">
            Manage your campaign content and tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-sidebar-primary/50! text-sidebar-primary hover:text-sidebar-primary/80 cursor-pointer"
            onClick={onNewPost}
          >
            <Plus className="h-4 w-4" />
            New Post
          </Button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
            <span className="text-sm font-semibold">{totalPosts}</span>
            <span className="text-xs text-muted-foreground">
              {totalPosts === 1 ? "post" : "posts"}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
        {/* Search Input */}
        <SearchInput
          queryParam="search"
          placeholder="Search posts by title..."
        />

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={currentFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
