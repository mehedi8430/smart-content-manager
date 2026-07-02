import { Suspense } from "react";
import { BoardProvider } from "./_context/BoardContext";
import { KanbanBoard } from "./_components/KanbanBoard";
import { SkeletonBoard } from "./_components/SkeletonBoard";

export default async function BoardPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const { campaignId } = await params;
  console.log(campaignId);

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
