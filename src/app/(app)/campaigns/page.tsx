import type { Metadata } from "next";
import { CampaignsView } from "@/components/campaigns/CampaignsView";
import { getCampaignData } from "@/lib/data";

export const metadata: Metadata = { title: "Campañas con IA" };

export default async function CampaignsPage({ searchParams }: PageProps<"/campaigns">) {
  const params = await searchParams;
  const data = await getCampaignData();
  const audience = Number(params.audience);

  return (
    <CampaignsView
      {...data}
      initialCreate={params.create === "1"}
      initialAudience={Number.isFinite(audience) && audience > 0 ? audience : undefined}
    />
  );
}
