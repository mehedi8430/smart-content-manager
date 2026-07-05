import { Suspense } from "react";
import { BoardProvider } from "./_context/BoardContext";
import { KanbanBoard } from "./_components/KanbanBoard";
import { SkeletonBoard } from "./_components/SkeletonBoard";
import { getCampaignAction } from "@/actions/campaign.action";
import { listPostsAction } from "@/actions/post.action";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: { campaignId: string };
  searchParams: { search?: string };
}) {
  const { campaignId } = await params;
  const campaign = await getCampaignAction(campaignId);
  const campaignName = campaign.data?.name || "N/A";
  const { search } = await searchParams;
  const posts = await listPostsAction(campaignId, { search: search || " " });

  return (
    <div className="container mx-auto p-6">
      <BoardProvider>
        <Suspense fallback={<SkeletonBoard />}>
          <KanbanBoard campaignName={campaignName} posts={posts?.data || []} />
        </Suspense>
      </BoardProvider>
    </div>
  );
}
