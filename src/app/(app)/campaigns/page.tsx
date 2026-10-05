import type { Metadata } from "next";
import { CampaignsView } from "@/components/campaigns/CampaignsView";
import { getCampaignData } from "@/lib/data";

export const metadata: Metadata = { title: "Campañas con IA" };

export default async function CampaignsPage({ searchParams }: PageProps<"/campaigns">) {
  const params = await searchParams;
  const campaignId = typeof params.campaignId === "string" ? params.campaignId : undefined;
  const data = await getCampaignData(campaignId);
  const audience = Number(params.audience);

  return (
    <CampaignsView
      {...data}
      initialCampaignId={campaignId}
      initialCreate={params.create === "1"}
      initialAudience={Number.isFinite(audience) && audience > 0 ? audience : undefined}
    />
  );
}
