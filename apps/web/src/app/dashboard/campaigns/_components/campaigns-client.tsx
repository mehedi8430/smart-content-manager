"use client";

import { useState, useEffect, useCallback } from "react";
import { CampaignsHeader } from "./campaigns-header";
import { CampaignsTable } from "./campaigns-table";
import { CreateCampaignModal } from "./create-campaign-modal";
import { EditCampaignModal } from "./edit-campaign-modal";
import { DeleteCampaignDialog } from "./delete-campaign-dialog";
import { Campaign } from "@/types/campaign.type";
import {
  createCampaignAction,
  listCampaignsAction,
  updateCampaignAction,
  deleteCampaignAction,
} from "@/actions/campaign.action";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function CampaignsClient() {
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        page: Number(searchParams.get("page")) || 1,
        limit: Number(searchParams.get("limit")) || 10,
        search: searchParams.get("search") || undefined,
        sortBy:
          (searchParams.get("sortBy") as "createdAt" | "name") || "createdAt",
        sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      };

      const result = await listCampaignsAction(query);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.data) {
        setCampaigns(result.data.data);
        setPagination(result.data.pagination);
      }
    } catch {
      const message = "Failed to fetch campaigns";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await createCampaignAction(formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setIsCreateModalOpen(false);
      setFormData({ name: "", description: "" });
      toast.success(result.message || "Campaign created successfully");
      await fetchCampaigns();
    } catch {
      const message = "Failed to create campaign";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    setIsSubmitting(true);
    try {
      const result = await updateCampaignAction(selectedCampaign.id, formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setIsEditModalOpen(false);
      setSelectedCampaign(null);
      setFormData({ name: "", description: "" });
      toast.success(result.message || "Campaign updated successfully");
      await fetchCampaigns();
    } catch {
      const message = "Failed to update campaign";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCampaign) return;
    setIsSubmitting(true);
    try {
      const result = await deleteCampaignAction(selectedCampaign.id);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setIsDeleteDialogOpen(false);
      setSelectedCampaign(null);
      toast.success(result.message || "Campaign deleted successfully");
      await fetchCampaigns();
    } catch {
      const message = "Failed to delete campaign";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      <CampaignsHeader onCreate={handleCreate} />

      <CampaignsTable
        campaigns={campaigns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pagination={pagination}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        formData={formData}
        onFormDataChange={setFormData}
        isSubmitting={isSubmitting}
      />

      <EditCampaignModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        formData={formData}
        onFormDataChange={setFormData}
        isSubmitting={isSubmitting}
      />

      <DeleteCampaignDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        campaignName={selectedCampaign?.name || ""}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
