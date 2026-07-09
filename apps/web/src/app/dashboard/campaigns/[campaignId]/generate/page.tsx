import { AiGeneratorProvider } from "@/providers/ai-generator-provider";
import { GeneratorForm } from "./_components/generator-form";
import { GeneratorOutput } from "./_components/generator-output";
import { getCampaignAction } from "@/actions/campaign.action";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function GeneratePage({
  params,
}: {
  params: { campaignId: string };
}) {
  const { campaignId } = await params;
  const campaign = await getCampaignAction(campaignId);
  const campaignName = campaign.data?.name || "N/A";

  return (
    <div className="container mx-auto md:p-6">
      <div className="space-y-6 mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {campaignName}
            </h1>
            <p className="text-muted-foreground">
              Generate AI-powered content for your campaign
            </p>
          </div>
          <Link href={`/dashboard/campaigns/${campaignId}/board`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Board
            </Button>
          </Link>
        </div>
      </div>

      <AiGeneratorProvider>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <GeneratorForm />
          </div>
          <div className="min-h-[400px]">
            <GeneratorOutput />
          </div>
        </div>
      </AiGeneratorProvider>
    </div>
  );
}
