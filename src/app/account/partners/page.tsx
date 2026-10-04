import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crest } from "@/components/crest";
import { openPartnerPlaces } from "@/lib/crm/partners";
import { readMemberSession } from "@/lib/crm/session";

export const metadata: Metadata = {
  title: "Partner places",
  description: "Sample partner bars and restaurants for signed-in members.",
  robots: { index: false, follow: false },
};

export default async function PartnerPlacesPage() {
  const session = await readMemberSession();
  const screen = openPartnerPlaces(
    session ? { role: "member", account: session.account } : { role: "anonymous" },
  );
  if (screen.phase !== "open") {
    redirect("/account");
  }

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
        rewards venues yet.
      </p>
      <ul className="mt-8 grid gap-4">
        {screen.places.map((place) => (
          <li
            key={place.name}
            className="rounded-2xl border border-gold/20 bg-forest/30 p-6"
          >
            <p className="font-serif text-xs tracking-[0.16em] text-gold uppercase">
              {place.kind === "bar" ? "Bar" : "Restaurant"} · Sample
            </p>
            <h2 className="font-display mt-2 text-3xl text-cream">{place.name}</h2>
            <p className="mt-3 text-cream/80">{place.offer}</p>
          </li>
        ))}
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
