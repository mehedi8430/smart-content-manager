"use client";

import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { PostStatus } from "@/types/post.type";
import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface BoardHeaderProps {
  campaignName: string;
  onNewPost: () => void;
  totalPosts: number;
}

export function BoardHeader({
  campaignName,
  onNewPost,
  totalPosts,
}: BoardHeaderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filterOptions = [
    { value: "" as const, label: "All" },
    { value: "todo" as const, label: "To Do" },
    { value: "in_progress" as const, label: "In Progress" },
    { value: "done" as const, label: "Done" },
  ];

  const handleClick = (filter: PostStatus | "") => {
    const params = new URLSearchParams(searchParams.toString());

    if (filter) {
      params.set("status", filter);
    } else {
      params.delete("status");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

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
              variant={
                option.value === ""
                  ? !searchParams.get("status")
                    ? "default"
                    : "outline"
                  : searchParams.get("status") === option.value
                    ? "default"
                    : "outline"
              }
              size="sm"
              onClick={() => handleClick(option.value)}
              className="cursor-pointer"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
