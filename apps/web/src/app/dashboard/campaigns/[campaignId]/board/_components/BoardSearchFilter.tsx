"use client";

import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { PostStatus } from "@/types/post.type";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function BoardSearchFilter() {
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
    <div className="space-y-4">
      {/* Search Input */}
      <SearchInput queryParam="search" placeholder="Search posts by title..." />

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
  );
}
