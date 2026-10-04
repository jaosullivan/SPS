import type { Metadata } from "next";
import Link from "next/link";
import { Crest } from "@/components/crest";
import { OwnDetailsForm } from "@/components/own-details-form";
import { memberAccountScreen } from "@/lib/crm/access";
import { readMemberSession } from "@/lib/crm/session";
import { signOutOfAccount } from "./actions";
import { AccountSignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Account",
  description: "Club member sign-in for the St. Patrick's Society website.",
  robots: { index: false, follow: false },
};

function detail(value: string | null) {
  return value && value.length > 0 ? value : "—";
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await readMemberSession();
  const screen = memberAccountScreen(
    session ? { outcome: "signedIn", session } : { outcome: "signedOut" },
  );
  const params = await searchParams;

  if (screen.phase === "account" && session) {
    const account = session.account;
    return (
      <article className="mx-auto flex max-w-lg flex-col px-4 py-16 sm:px-6">
        <div className="flex items-center gap-4">
          <Crest size={72} className="h-16 w-16" />
          <div>
            <p className="font-serif text-xs tracking-[0.24em] text-gold uppercase">
              Account
            </p>
            <h1 className="font-display mt-2 text-4xl text-cream">
              {screen.holderName}
            </h1>
          </div>
        </div>
        <p className="mt-6 text-cream/75">
          Update your phone, email, and company. Your name, membership status,
          and green card stay as they are.
        </p>
        <Link
          href="/account/partners"
          className="mt-4 inline-flex text-sm font-semibold text-gold hover:underline"
        >
          Partner places
        </Link>
        {params.error === "denied" ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-bauhinia/40 bg-bauhinia/10 px-3 py-2 text-sm text-cream"
          >
            Those details were not saved.
          </p>
        ) : null}
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="text-cream/60">Name</dt>
            <dd className="mt-1 text-cream">{screen.holderName}</dd>
          </div>
          <div>
            <dt className="text-cream/60">Status</dt>
            <dd className="mt-1 text-cream">{account.status}</dd>
          </div>
          <div>
            <dt className="text-cream/60">Green card</dt>
            <dd className="mt-1 text-cream">{detail(screen.greenCardNumber)}</dd>
          </div>
        </dl>
        <OwnDetailsForm member={account} />
        <form action={signOutOfAccount} className="mt-6">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full border border-gold/40 px-4 text-sm text-gold hover:bg-forest/60"
          >
            Sign out
          </button>
        </form>
      </article>
    );
  }

  return (
    <article className="mx-auto flex max-w-lg flex-col px-4 py-16 sm:px-6">
      <div className="flex items-center gap-4">
        <Crest size={72} className="h-16 w-16" />
        <div>
          <p className="font-serif text-xs tracking-[0.24em] text-gold uppercase">
            Account
          </p>
          <h1 className="font-display mt-2 text-4xl text-cream">Sign in</h1>
        </div>
      </div>
      <p className="mt-6 text-cream/75">
        Club members sign in here with the same account as the iPhone app.
      </p>
      <AccountSignInForm />
    </article>
  );
}
