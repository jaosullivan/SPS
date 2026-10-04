import type { Metadata } from "next";
import { CrmSection } from "@/components/crm-section";

export const metadata: Metadata = {
  title: "Sponsors",
};

export default function CrmSponsorsPage() {
  return (
    <CrmSection
      title="Sponsors"
      copy="Sponsorship is managed from this area."
    />
  );
}
