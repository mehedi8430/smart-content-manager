export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Smart Content and Campaign Manager dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-muted-foreground">
              Active Campaigns
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="text-2xl font-bold">48</div>
            <div className="text-xs text-muted-foreground">Content Pieces</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="text-2xl font-bold">2.4k</div>
            <div className="text-xs text-muted-foreground">Total Views</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="text-2xl font-bold">89%</div>
            <div className="text-xs text-muted-foreground">Engagement Rate</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Your recent campaigns and content updates will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
