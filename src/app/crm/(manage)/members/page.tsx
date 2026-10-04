import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MemberRecordForm } from "@/components/member-record-form";
import { websiteClub } from "@/lib/crm/fixtures";
import { readAdminSession } from "@/lib/crm/session";

export const metadata: Metadata = {
  title: "Members",
};

export default async function CrmMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await readAdminSession();
  const screen = websiteClub().openMembersScreen(
    session ? { role: "admin", session } : { role: "anonymous" },
  );
  if (screen.phase !== "open") {
    redirect("/crm/login");
  }
  const params = await searchParams;

  return (
    <section className="mt-10">
      <h1 className="font-display text-4xl text-cream">Members</h1>
      <p className="mt-4 max-w-2xl text-cream/75">
        Club members, with name, email, phone, company, status, and green card.
      </p>
      {params.error === "denied" ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-bauhinia/40 bg-bauhinia/10 px-3 py-2 text-sm text-cream"
        >
          That member record was not saved.
        </p>
      ) : null}
      <div className="mt-8 grid gap-6">
        {screen.members.map((member) => (
          <MemberRecordForm key={member.id} member={member} />
        ))}
      </div>
    </section>
  );
}