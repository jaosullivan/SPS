import type { Metadata } from "next";
import Link from "next/link";
import { Crest } from "@/components/crest";
import { Knot } from "@/components/ornament";
import { committee, pastPresidents, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: `The St. Patrick's Society has been Hong Kong’s Irish community since ${site.founded} — connecting people, celebrating culture, and supporting local causes.`,
};

export default function AboutPage() {
  return (
    <article>
      <header className="border-b border-gold/15 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.12),transparent_40%)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[auto_1fr]">
          <Crest size={200} priority className="mx-auto h-40 w-40 lg:mx-0" />
          <div>
            <p className="font-serif text-xs tracking-[0.24em] text-gold uppercase">
              About the Society
            </p>
            <h1 className="font-display mt-2 text-4xl text-cream sm:text-5xl">
              Irish community, Hong Kong home
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-cream/78">
              In a city that moves quickly, finding your people matters. Since{" "}
              {site.founded}, the Society has been that connection point for
              Irish people and friends of Ireland.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p>
          We exist to foster genuine connections and celebrate Irish culture.
          From the annual Gala Ball to quieter cultural evenings and
          family-friendly gatherings, we make room for stories, friendships,
          and a piece of Ireland lived here.
        </p>
        <p className="mt-5">
          Beyond the celebrations, we are committed to a positive impact.
          Charitable efforts support local Hong Kong causes — the same
          generosity that sits at the Society’s core.
        </p>
        <p className="mt-5 text-gold">
          Connect, celebrate, contribute. Irish culture thrives here, and
          everyone is invited to be part of the story.
        </p>
        <Knot className="mx-auto my-10 h-6 w-24 text-gold/60" />
      </div>

      <section className="bg-forest/30">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl text-cream">The committee</h2>
          <p className="mt-3 max-w-2xl text-cream/70">
            Volunteers who keep the diary, the Gala, and the Green Card moving.
            Write to {site.email} if you would like to help.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {committee.map((member) => (
              <li
                key={member.name}
                className="rounded-2xl border border-gold/20 bg-ink/35 px-5 py-5"
              >
                <p className="font-serif text-xs tracking-[0.16em] text-gold uppercase">
                  {member.role}
                </p>
                <p className="mt-2 text-lg text-cream">{member.name}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-3xl text-cream">
          From Sir Joseph Kemp onward
        </h2>
        <p className="mt-4 max-w-3xl text-cream/75">
          The Society’s first President was Sir Joseph Kemp — born in Dublin in
          1874, later Chief Justice of Hong Kong. On his retirement he was
          elected the Society’s first President, beginning a line of people who
          have served both Hong Kong and Irish culture overseas. (The earliest
          years of the roll sit alongside the Society’s founding in{" "}
          {site.founded}.)
        </p>
        <ol className="mt-8 columns-1 gap-x-10 text-sm text-cream/80 sm:columns-2 lg:columns-3">
          {pastPresidents.map((president) => (
            <li
              key={`${president.year}-${president.name}`}
              className="mb-2 break-inside-avoid"
            >
              <span className="text-gold">{president.year}</span>{" "}
              {president.name}
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-gold/15">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center">
          <p className="max-w-xl text-cream/75">
            Questions about membership, history, or how to get involved? The
            inbox is open.
          </p>
          <Link
            href="/contact"
            className="inline-flex min-h-12 items-center rounded-full bg-saffron px-6 text-sm font-semibold text-ink hover:bg-gold"
          >
            Contact the Society
          </Link>
        </div>
      </section>
    </article>
  );
}
