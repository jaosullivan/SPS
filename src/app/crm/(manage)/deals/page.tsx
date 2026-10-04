import type { Metadata } from "next";
import { CrmSection } from "@/components/crm-section";

export const metadata: Metadata = {
  title: "Deals",
};

export default function CrmDealsPage() {
  return (
    <CrmSection title="Deals" copy="Deals are managed from this area." />
  );
}