import { listCampaignsAction } from "@/actions/campaign.action";
import { listPostsAction } from "@/actions/post.action";
import { formatDistanceToNow } from "date-fns";

function formatMetricValue(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }

  return value.toString();
}

export default async function DashboardPage() {
  const campaignsResult = await listCampaignsAction({
    limit: 30,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const campaigns = campaignsResult.data?.data ?? [];

  const campaignPosts = await Promise.all(
    campaigns.map(async (campaign) => ({
      campaignId: campaign.id,
      campaignName: campaign.name,
      posts: (await listPostsAction(campaign.id)).data ?? [],
    })),
  );

  const allPosts = campaignPosts.flatMap((entry) =>
    entry.posts.map((post) => ({
      ...post,
      campaignName: entry.campaignName,
    })),
  );

  const totalPosts = allPosts.length;
  const totalCampaigns = campaigns.length;
  const totalAiOutputs = campaigns.reduce(
    (sum, campaign) => sum + (campaign._count?.outputs ?? 0),
    0,
  );
  const completedPosts = allPosts.filter((post) => post.status === "done").length;
  const completionRate = totalPosts > 0 ? Math.round((completedPosts / totalPosts) * 100) : 0;

  const recentActivity = [...campaigns, ...allPosts]
    .map((item) => {
      if ("description" in item && "campaignId" in item && "status" in item) {
        return {
          id: item.id,
          title: `${item.campaignName ?? "Post"}: ${item.title}`,
          description: item.status,
          timestamp: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
          type: "post",
        };
      }

      return {
        id: item.id,
        title: `${item.name} campaign`,
        description: item.description ?? "Campaign updated",
        timestamp: item.updatedAt ?? item.createdAt,
        type: "campaign",
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const campaignsWithContent = campaigns.filter(
    (campaign) => (campaign._count?.posts ?? 0) > 0,
  ).length;

  const stats = [
    {
      label: "Active Campaigns",
      value: totalCampaigns,
      helper: `${campaignsWithContent} with content`,
    },
    {
      label: "Content Pieces",
      value: formatMetricValue(totalPosts),
      helper: `${completedPosts} completed`,
    },
    {
      label: "AI Outputs",
      value: formatMetricValue(totalAiOutputs),
      helper: `${campaigns.length ? Math.round(totalAiOutputs / campaigns.length) : 0} avg / campaign`,
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      helper: `${completedPosts}/${totalPosts} finished`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Smart Content and Campaign Manager dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              <div className="mt-2 text-[11px] text-muted-foreground/80">{stat.helper}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <span className="text-xs text-muted-foreground">
              {recentActivity.length} updates
            </span>
          </div>

          {recentActivity.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 p-3"
                >
                  <div className="mt-1 flex size-8 items-center justify-center rounded-full bg-sidebar-primary/15 text-sidebar-primary">
                    {item.type === "campaign" ? "C" : "P"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-medium text-sm">{item.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Your recent campaigns and content updates will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
