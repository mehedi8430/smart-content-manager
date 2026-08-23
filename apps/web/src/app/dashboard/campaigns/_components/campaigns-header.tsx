import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CampaignsHeaderProps {
  onCreate: () => void;
}

export function CampaignsHeader({ onCreate }: CampaignsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground">
          Manage your content campaigns and track their performance
        </p>
      </div>
      <Button
        variant="outline"
        className="border-sidebar-primary/50! text-sidebar-primary hover:text-sidebar-primary/80 cursor-pointer"
        onClick={onCreate}
      >
        <Plus className="h-4 w-4" />
        Create Campaign
      </Button>
    </div>
  );
}
