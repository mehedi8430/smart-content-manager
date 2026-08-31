"use client";

import Link from "next/link";
import { Search, Sparkles, X, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { listCampaignsAction } from "@/actions/campaign.action";
import type { Campaign } from "@/types/campaign.type";

export function CampaignSearch() {
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Campaign[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setHasError(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await listCampaignsAction({
          search: trimmed,
          limit: 6,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        if (response.error) {
          setHasError(true);
          toast.error(response.error);
          setResults([]);
        } else {
          setResults(response.data?.data ?? []);
        }
        setIsOpen(true);
      } catch (_error) {
        console.error("Error searching campaigns:", _error);
        setHasError(true);
        toast.error("Failed to search campaigns");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleClear = () => {
    setSearchQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleSelect = () => {
    setIsOpen(false);
    setSearchQuery("");
    setResults([]);
  };

  return (
    <div ref={searchRef} className="relative hidden lg:block">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onFocus={() => searchQuery.trim() && setIsOpen(true)}
          placeholder="Search campaigns..."
          className="h-10 w-90 rounded-full border border-border bg-background pl-9 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-sidebar-primary/60 focus:ring-3 focus:ring-sidebar-primary/15"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-105 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl ring-1 ring-border">
          <div className="flex items-center justify-between border-b px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span>Campaign search</span>
            <span>{isLoading ? "Searching..." : `${results.length} results`}</span>
          </div>

          {isLoading ? (
            <div className="space-y-2 p-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-xl bg-muted/70"
                />
              ))}
            </div>
          ) : hasError ? (
            <div className="flex items-center gap-2 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Failed to search campaigns. Please try again.</span>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-90 overflow-y-auto p-2">
              {results.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}/board`}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent"
                  onClick={handleSelect}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{campaign.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {campaign.description || "Campaign overview"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    campaign
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              No campaigns found for “{searchQuery}”.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
