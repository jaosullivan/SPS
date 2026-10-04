import type { Metadata } from "next";
import { CrmSection } from "@/components/crm-section";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function CrmDashboardPage() {
  return (
    <CrmSection
      title="Dashboard"
      copy="Privileged CRM for St. Patrick's Society Hong Kong."
    />
  );
}
