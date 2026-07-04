import { Suspense } from "react";
import { BoardProvider } from "./_context/BoardContext";
import { KanbanBoard } from "./_components/KanbanBoard";
import { SkeletonBoard } from "./_components/SkeletonBoard";
import { getCampaignAction } from "@/actions/campaign.action";

export default async function BoardPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const { campaignId } = await params;
  const campaign = await getCampaignAction(campaignId);
  const campaignName = campaign.data?.name || "N/A";

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
