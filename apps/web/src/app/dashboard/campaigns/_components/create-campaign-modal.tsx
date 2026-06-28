import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    name: string;
    description: string;
  };
  onFormDataChange: (data: { name: string; description: string }) => void;
  isSubmitting?: boolean;
}

export function CreateCampaignModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormDataChange,
  isSubmitting = false,
}: CreateCampaignModalProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create Campaign</SheetTitle>
          <SheetDescription>
            Create a new campaign to organize your content
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="mt-6 space-y-4 px-4">
          <Field>
            <FieldLabel>Name *</FieldLabel>
            <FieldContent>
              <input
                type="text"
                placeholder="Campaign name"
                value={formData.name}
                onChange={(e) =>
                  onFormDataChange({ ...formData, name: e.target.value })
                }
                required
                maxLength={120}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <FieldContent>
              <input
                type="text"
                placeholder="Campaign description (optional)"
                value={formData.description}
                onChange={(e) =>
                  onFormDataChange({ ...formData, description: e.target.value })
                }
                maxLength={2000}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FieldContent>
          </Field>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Campaign"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
