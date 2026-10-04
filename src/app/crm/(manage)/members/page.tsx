import type { Metadata } from "next";
import { CrmSection } from "@/components/crm-section";

export const metadata: Metadata = {
  title: "Members",
};

export default function CrmMembersPage() {
  return (
    <CrmSection
      title="Members"
      copy="Membership is managed from this area."
    />
  );
}
