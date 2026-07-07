import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonBoard() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Search and Filter Skeleton */}
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Board Skeleton */}
      <div className="flex gap-4 overflow-x-auto">
        {[1, 2, 3].map((col) => (
          <div
            key={col}
            className="min-w-87.5 space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900"
          >
            {/* Column Header */}
            <Skeleton className="h-8 w-32 mb-4" />

            {/* Cards */}
            {[1, 2, 3].map((card) => (
              <div key={card} className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}

            {/* Add Button */}
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
