import { Suspense } from "react";
import { BoardProvider } from "../../../../../providers/board-provider";
import { SkeletonBoard } from "./_components/SkeletonBoard";
import { getCampaignAction } from "@/actions/campaign.action";
import { listPostsAction } from "@/actions/post.action";
import { KanbanBoard } from "./_components/KanbanBoard";

export default async function BoardPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const { campaignId } = await params;
  const campaign = await getCampaignAction(campaignId);
  const campaignName = campaign.data?.name || "N/A";

  const posts = await listPostsAction(campaignId);

  return (
    <div className="container mx-auto md:p-6">
      <BoardProvider campaignId={campaignId}>
        <Suspense fallback={<SkeletonBoard />}>
          <KanbanBoard campaignName={campaignName} posts={posts?.data || []} />
        </Suspense>
      </BoardProvider>
    </div>
  );
}
