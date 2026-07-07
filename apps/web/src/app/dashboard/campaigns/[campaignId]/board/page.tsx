import { Suspense } from "react";
import { BoardProvider } from "../../../../../providers/board-provider";
import { SkeletonBoard } from "./_components/SkeletonBoard";
import { getCampaignAction } from "@/actions/campaign.action";
import { listPostsAction } from "@/actions/post.action";
import { PostStatus } from "@/types/post.type";
import { KanbanBoardTest } from "./_components/KanbanBoardTest";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: { campaignId: string };
  searchParams: { search?: string; status?: PostStatus };
}) {
  const { campaignId } = await params;
  const campaign = await getCampaignAction(campaignId);
  const campaignName = campaign.data?.name || "N/A";

  const { search, status } = await searchParams;
  const posts = await listPostsAction(campaignId, {
    search,
    status,
  });

  return (
    <div className="container mx-auto md:p-6">
      <BoardProvider campaignId={campaignId}>
        <Suspense fallback={<SkeletonBoard />}>
          <KanbanBoardTest campaignName={campaignName} posts={posts?.data || []} />
          {/* <KanbanBoard campaignName={campaignName} posts={posts?.data || []} /> */}
        </Suspense>
      </BoardProvider>
    </div>
  );
}
