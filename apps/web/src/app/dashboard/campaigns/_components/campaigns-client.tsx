"use client";

import { useState } from "react";
import { CampaignsHeader } from "./campaigns-header";
import { CampaignsTable } from "./campaigns-table";
import { CreateCampaignModal } from "./create-campaign-modal";
import { EditCampaignModal } from "./edit-campaign-modal";
import { DeleteCampaignDialog } from "./delete-campaign-dialog";
import { Campaign } from "@/types/campaign.type";
import {
  useCampaignsList,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
} from "@/hooks/server-state/useCampaigns";
import { useSearchParams } from "next/navigation";

export default function CampaignsClient() {
  const searchParams = useSearchParams();

  const query = {
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 10,
    search: searchParams.get("search") || undefined,
    sortBy:
      (searchParams.get("sortBy") as "createdAt" | "name") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  };

  const { data, isLoading, isError, error } = useCampaignsList(query);
  const campaigns = data?.data ?? [];
  const pagination = data?.pagination;

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

  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();

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
      await createMutation.mutateAsync(formData);
      setIsCreateModalOpen(false);
      setFormData({ name: "", description: "" });
    } catch {
      // Toast already shown by the mutation hook.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        id: selectedCampaign.id,
        payload: formData,
      });
      setIsEditModalOpen(false);
      setSelectedCampaign(null);
      setFormData({ name: "", description: "" });
    } catch {
      // Toast already shown by the mutation hook.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCampaign) return;
    setIsSubmitting(true);
    try {
      await deleteMutation.mutateAsync(selectedCampaign.id);
      setIsDeleteDialogOpen(false);
      setSelectedCampaign(null);
    } catch {
      // Toast already shown by the mutation hook.
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorMessage = isError
    ? error instanceof Error
      ? error.message
      : "Failed to fetch campaigns"
    : null;

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
      <CampaignsHeader onCreate={handleCreate} />

      <CampaignsTable
        campaigns={campaigns}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={isLoading}
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
