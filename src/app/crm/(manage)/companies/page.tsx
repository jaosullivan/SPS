import type { Metadata } from "next";
import { CrmSection } from "@/components/crm-section";

export const metadata: Metadata = {
  title: "Companies",
};

export default function CrmCompaniesPage() {
  return (
    <CrmSection
      title="Companies"
      copy="Companies are managed from this area."
    />
  );
}
