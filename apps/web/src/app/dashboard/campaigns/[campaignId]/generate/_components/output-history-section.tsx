"use client";

import { useRouter } from "next/navigation";
import { OutputHistory } from "./output-history";

export function OutputHistorySection({ campaignId }: { campaignId: string }) {
  const router = useRouter();

  const handleUseInPost = (content: string) => {
    const params = new URLSearchParams({ content });
    router.push(
      `/dashboard/campaigns/${campaignId}/board?${params.toString()}`,
    );
  };

  return <OutputHistory campaignId={campaignId} onUseInPost={handleUseInPost} />;
}
