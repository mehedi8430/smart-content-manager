"use client";

import { useState } from "react";
import { CampaignsHeader } from "./_components/campaigns-header";
import { CampaignsSearch } from "./_components/campaigns-search";
import { CampaignsTable } from "./_components/campaigns-table";
import { CreateCampaignModal } from "./_components/create-campaign-modal";
import { EditCampaignModal } from "./_components/edit-campaign-modal";
import { DeleteCampaignDialog } from "./_components/delete-campaign-dialog";

// Mock data type
interface Campaign {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  postsCount: number;
  outputsCount: number;
}

// Mock data
const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Summer Sale Campaign",
    description: "Promotional campaign for summer sale events",
    createdAt: "2024-06-15T10:30:00Z",
    postsCount: 12,
    outputsCount: 45,
  },
  {
    id: "2",
    name: "Product Launch",
    description: "New product introduction campaign",
    createdAt: "2024-06-10T14:20:00Z",
    postsCount: 8,
    outputsCount: 32,
  },
  {
    id: "3",
    name: "Brand Awareness",
    description: null,
    createdAt: "2024-06-05T09:15:00Z",
    postsCount: 15,
    outputsCount: 60,
  },
  {
    id: "4",
    name: "Holiday Special",
    description: "Holiday season promotional content",
    createdAt: "2024-05-28T16:45:00Z",
    postsCount: 20,
    outputsCount: 78,
  },
  {
    id: "5",
    name: "Customer Testimonials",
    description: "Campaign featuring customer success stories",
    createdAt: "2024-05-20T11:00:00Z",
    postsCount: 6,
    outputsCount: 24,
  },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"createdAt" | "name">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Filter and sort campaigns
  const filteredCampaigns = campaigns
    .filter((campaign) =>
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const comparison = a[sortBy].localeCompare(b[sortBy]);
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Pagination
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Handlers
  const handleCreate = () => {
    setSelectedCampaign(null);
    setFormData({ name: "", description: "" });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description || null,
      createdAt: new Date().toISOString(),
      postsCount: 0,
      outputsCount: 0,
    };
    setCampaigns([newCampaign, ...campaigns]);
    setIsCreateModalOpen(false);
    setFormData({ name: "", description: "" });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    setCampaigns(
      campaigns.map((c) =>
        c.id === selectedCampaign.id
          ? {
              ...c,
              name: formData.name,
              description: formData.description || null,
            }
          : c,
      ),
    );
    setIsEditModalOpen(false);
    setSelectedCampaign(null);
    setFormData({ name: "", description: "" });
  };

  const handleDeleteConfirm = () => {
    if (!selectedCampaign) return;
    setCampaigns(campaigns.filter((c) => c.id !== selectedCampaign.id));
    setIsDeleteDialogOpen(false);
    setSelectedCampaign(null);
  };

  const handleSort = (field: "createdAt" | "name") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <CampaignsHeader onCreate={handleCreate} />

      <CampaignsSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={filteredCampaigns.length}
      />

      <CampaignsTable
        campaigns={paginatedCampaigns}
        currentPage={currentPage}
        totalPages={totalPages}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        formData={formData}
        onFormDataChange={setFormData}
      />

      <EditCampaignModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        formData={formData}
        onFormDataChange={setFormData}
      />

      <DeleteCampaignDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        campaignName={selectedCampaign?.name || ""}
      />
    </div>
  );
}
