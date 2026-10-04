import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { earnOfferAtPlace } from "@/app/account/actions";
import { Crest } from "@/components/crest";
import { websiteEarnings } from "@/lib/crm/earnings";
import { openPartnerPlaces } from "@/lib/crm/partners";
import { readMemberSession } from "@/lib/crm/session";

export const metadata: Metadata = {
  title: "Partner places",
  description: "Sample partner bars and restaurants for signed-in members.",
  robots: { index: false, follow: false },
};

export default async function PartnerPlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; place?: string; earned?: string }>;
}) {
  const session = await readMemberSession();
  const screen = openPartnerPlaces(
    session ? { role: "member", account: session.account } : { role: "anonymous" },
  );
  if (screen.phase !== "open" || !session) {
    redirect("/account");
  }
  const params = await searchParams;
  const earned = websiteEarnings().forMember(session.account.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex items-center gap-4">
        <Crest size={72} className="h-16 w-16" />
        <div>
          <p className="font-serif text-xs tracking-[0.24em] text-gold uppercase">
            Rewards
          </p>
          <h1 className="font-display mt-2 text-4xl text-cream">Partner places</h1>
        </div>
      </div>
      <p className="mt-6 max-w-2xl text-cream/75">
        Sample bars and restaurants for this list. They are not real partner
        businesses. Neither this website nor the older CRM names actual
        rewards venues yet. Earning an offer here records that place&apos;s
        existing offer for you. It does not add points, and it is not redeemed
        at the venue on this page.
      </p>
      {params.error === "denied" ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-bauhinia/40 bg-bauhinia/10 px-3 py-2 text-sm text-cream"
        >
          That offer was not earned.
        </p>
      ) : null}
      <ul className="mt-8 grid gap-4">
        {screen.places.map((place) => {
          const reward = earned.find((entry) => entry.placeName === place.name);
          return (
            <li
              key={place.name}
              className="rounded-2xl border border-gold/20 bg-forest/30 p-6"
            >
              <p className="font-serif text-xs tracking-[0.16em] text-gold uppercase">
                {place.kind === "bar" ? "Bar" : "Restaurant"} · Sample
              </p>
              <h2 className="font-display mt-2 text-3xl text-cream">{place.name}</h2>
              <p className="mt-3 text-cream/80">{place.offer}</p>
              {reward ? (
                <p className="mt-4 text-sm font-semibold text-gold">Offer earned</p>
              ) : (
                <form action={earnOfferAtPlace} className="mt-4">
                  <input type="hidden" name="place" value={place.name} />
                  <input type="hidden" name="memberId" value={session.account.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-saffron px-6 text-sm font-semibold text-ink hover:bg-gold"
                  >
                    Earn this offer
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
      <Link
        href="/account"
        className="mt-8 inline-flex text-sm font-semibold text-gold hover:underline"
      >
        Back to account
      </Link>
    </article>
  );
}
