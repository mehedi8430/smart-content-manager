import React, { Suspense } from "react";
import { BoardProvider } from "./_context/BoardContext";
import { KanbanBoard } from "./_components/KanbanBoard";
import { SkeletonBoard } from "./_components/SkeletonBoard";

export default function BoardPage() {
  // TODO: Use params.campaignId to fetch campaign data from API
  // Mock campaign name - in production this would be fetched from API
  const campaignName = "Summer Launch 2026";

  return (
    <div className="container mx-auto p-6">
      <BoardProvider>
        <Suspense fallback={<SkeletonBoard />}>
          <KanbanBoard campaignName={campaignName} />
        </Suspense>
      </BoardProvider>
    </div>
  );
}
