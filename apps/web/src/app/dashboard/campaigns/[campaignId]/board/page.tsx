import { Suspense } from "react";
import { BoardProvider } from "../../../../../providers/board-provider";
import { KanbanBoard } from "./_components/KanbanBoard";
import { SkeletonBoard } from "./_components/SkeletonBoard";
import { getCampaignAction } from "@/actions/campaign.action";
import { listPostsAction } from "@/actions/post.action";
import { PostStatus } from "@/types/post.type";

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
    search: search || " ",
    status: status,
  });

  return (
    <div className="container mx-auto p-6">
      <BoardProvider campaignId={campaignId}>
        <Suspense fallback={<SkeletonBoard />}>
          <KanbanBoard campaignName={campaignName} posts={posts?.data || []} />
        </Suspense>
      </BoardProvider>
    </div>
  );
}
