import { Suspense } from "react";
import CampaignsClient from "./_components/campaigns-client";

export default function CampaignsPage() {
  return (
    <Suspense fallback={<>...</>}>
      <CampaignsClient />
    </Suspense>
  );
}
