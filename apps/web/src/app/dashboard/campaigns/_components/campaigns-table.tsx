"use client";

import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchInput } from "@/components/search-input";
import { Campaign } from "@/types/campaign.type";
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
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CampaignsTableProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  loading?: boolean;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function CampaignsTable({
  campaigns,
  onEdit,
  onDelete,
  loading = false,
  pagination,
}: CampaignsTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handlers
  const handleSort = (field: "createdAt" | "name") => {
    const currentSort = searchParams.get("sortBy") || "createdAt";
    const currentOrder = searchParams.get("sortOrder") || "desc";

    const newSort = currentSort === field ? field : "createdAt";
    const newOrder =
      currentSort === field && currentOrder === "asc" ? "desc" : "asc";

    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", newSort);
    params.set("sortOrder", newOrder);
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <CardHeader className="w-full">
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            A list of all your campaigns with their post and output counts
          </CardDescription>
        </CardHeader>

        {/* Search Input */}
        <SearchInput placeholder="Search campaigns..." queryParam="search" />
      </div>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left font-medium min-w-40">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("name")}
                    className="gap-1 font-medium"
                  >
                    Name
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </th>
                <th className="pb-3 text-left font-medium">Description</th>
                <th className="pb-3 text-left font-medium px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("createdAt")}
                    className="gap-1 font-medium"
                  >
                    Created
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </th>
                <th className="pb-3 text-center font-medium px-2">Posts</th>
                <th className="pb-3 text-center font-medium px-2">Outputs</th>
                <th className="pb-3 text-right font-medium px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // show 5 skeleton rows while loading
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b">
                    <td className="py-4">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="py-4">
                      <Skeleton className="h-4 max-w-xs" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-4 text-center">
                      <Skeleton className="h-5 w-8 rounded-full" />
                    </td>
                    <td className="py-4 text-center">
                      <Skeleton className="h-5 w-8 rounded-full" />
                    </td>
                    <td className="py-4 text-right">
                      <Skeleton className="h-6 w-20" />
                    </td>
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
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
                  <tr
                    key={campaign.id}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      router.push(`/dashboard/campaigns/${campaign.id}/board`);
                    }}
                  >
                    <td className="py-4">
                      <div className="font-medium">{campaign.name}</div>
                    </td>
                    <td className="py-4">
                      <div className="max-w-xs truncate text-sm text-muted-foreground">
                        {campaign.description || "-"}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground px-2">
                      {formatDate(campaign.createdAt)}
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {campaign._count.posts}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {campaign._count.outputs}
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
                            onClick={() =>
                              router.push(
                                `/dashboard/campaigns/${campaign.id}/board`,
                              )
                            }
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Board
                          </DropdownMenuItem>
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
              Page {currentPage} of {totalPages} ({pagination?.total || 0}{" "}
              total)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
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
