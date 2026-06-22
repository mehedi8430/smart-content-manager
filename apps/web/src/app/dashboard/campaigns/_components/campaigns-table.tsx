import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  postsCount: number;
  outputsCount: number;
}

interface CampaignsTableProps {
  campaigns: Campaign[];
  currentPage: number;
  totalPages: number;
  onSort: (field: "createdAt" | "name") => void;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  onPageChange: (page: number) => void;
}

export function CampaignsTable({
  campaigns,
  currentPage,
  totalPages,
  onSort,
  onEdit,
  onDelete,
  onPageChange,
}: CampaignsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Campaigns</CardTitle>
        <CardDescription>
          A list of all your campaigns with their post and output counts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSort("name")}
                    className="gap-1 font-medium"
                  >
                    Name
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </th>
                <th className="pb-3 text-left font-medium">Description</th>
                <th className="pb-3 text-left font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSort("createdAt")}
                    className="gap-1 font-medium"
                  >
                    Created
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </th>
                <th className="pb-3 text-center font-medium">Posts</th>
                <th className="pb-3 text-center font-medium">Outputs</th>
                <th className="pb-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No campaigns found. Create your first campaign to get
                    started.
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b hover:bg-muted/50">
                    <td className="py-4">
                      <div className="font-medium">{campaign.name}</div>
                    </td>
                    <td className="py-4">
                      <div className="max-w-xs truncate text-sm text-muted-foreground">
                        {campaign.description || "-"}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {formatDate(campaign.createdAt)}
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {campaign.postsCount}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {campaign.outputsCount}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onEdit(campaign)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(campaign)}
                            className="gap-2 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
