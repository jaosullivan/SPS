import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Crest } from "@/components/crest";
import { ADMIN } from "@/lib/crm/access";
import { readAdminSession } from "@/lib/crm/session";
import { CrmLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "CRM sign in",
  description: "Admin sign-in for the St. Patrick's Society CRM.",
  robots: { index: false, follow: false },
};

export default async function CrmLoginPage() {
  const session = await readAdminSession();
  if (session) {
    redirect("/crm");
  }

  return (
    <article className="mx-auto flex max-w-lg flex-col px-4 py-16 sm:px-6">
      <div className="flex items-center gap-4">
        <Crest size={72} className="h-16 w-16" />
        <div>
          <p className="font-serif text-xs tracking-[0.24em] text-gold uppercase">
            CRM
          </p>
          <h1 className="font-display mt-2 text-4xl text-cream">Sign in</h1>
        </div>
      </div>
      <p className="mt-6 text-cream/75">
        The admin account holder signs in here to manage the CRM.
      </p>
      <CrmLoginForm defaultEmail={ADMIN.email} />
    </article>
  );
}
