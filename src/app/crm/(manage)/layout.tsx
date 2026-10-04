import { redirect } from "next/navigation";
import { CrmNav } from "@/components/crm-nav";
import { crmNavigation } from "@/lib/crm/access";
import { readAdminSession } from "@/lib/crm/session";
import { signOutOfCrm } from "@/app/crm/actions";

export default async function CrmManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readAdminSession();
  if (!session) {
    redirect("/crm/login");
  }

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-serif text-xs tracking-[0.24em] text-gold uppercase">
            CRM
          </p>
          <p className="mt-2 text-lg text-cream">
            Signed in as {session.holder.fullName}
          </p>
          <p className="text-sm text-cream/70">{session.holder.email}</p>
        </div>
        <form action={signOutOfCrm}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full border border-gold/40 px-4 text-sm text-gold hover:bg-forest/60"
          >
            Sign out
          </button>
        </form>
      </header>
      <CrmNav links={crmNavigation(session)} />
      {children}
    </article>
  );
}
