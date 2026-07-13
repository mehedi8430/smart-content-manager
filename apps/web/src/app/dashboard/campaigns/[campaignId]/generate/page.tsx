import { AiGeneratorProvider } from "@/providers/ai-generator-provider";
import { GeneratorForm } from "./_components/generator-form";
import { GeneratorOutput } from "./_components/generator-output";
import { OutputHistorySection } from "./_components/output-history-section";
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
            <Button variant="outline" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Board
            </Button>
          </Link>
        </div>
      </div>

      <AiGeneratorProvider>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <GeneratorForm campaignId={campaignId} />
          </div>
          <div className="min-h-100">
            <GeneratorOutput campaignId={campaignId} />
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Output History
          </h2>
          <p className="text-muted-foreground mb-6">
            All AI-generated content for this campaign
          </p>
          <OutputHistorySection campaignId={campaignId} />
        </section>
      </AiGeneratorProvider>
    </div>
  );
}
