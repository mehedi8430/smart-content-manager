import { AiGeneratorProvider } from "@/providers/ai-generator-provider";
import { GeneratorForm } from "./_components/generator-form";
import { GeneratorOutput } from "./_components/generator-output";
import { getCampaignAction } from "@/actions/campaign.action";

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{campaignName}</h1>
          <p className="text-muted-foreground">
            Generate AI-powered content for your campaign
          </p>
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
