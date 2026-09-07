import Link from "next/link";
import { Crest } from "@/components/crest";
import { EventList } from "@/components/event-list";
import { Knot, ShamrockMark } from "@/components/ornament";
import { upcomingEvents } from "@/lib/events";
import { site } from "@/lib/site";

const pillars = [
  {
    title: "Connect",
    copy: "Find your people in a fast city — Irish, friends of Ireland, and families building a life here.",
  },
  {
    title: "Celebrate",
    copy: "From the Gala Ball to quizzes, language classes, and beach days: heritage lived out loud.",
  },
  {
    title: "Contribute",
    copy: "Charitable work that supports Hong Kong causes, with the same generosity at the Society’s core.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(228,122,47,0.16),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(11,61,44,0.9),transparent_50%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_1.1fr] lg:py-24">
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-6 rounded-full bg-gold/15 blur-3xl"
              />
              <Crest
                size={420}
                priority
                className="relative h-64 w-64 drop-shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:h-80 sm:w-80 lg:h-[420px] lg:w-[420px]"
              />
            </div>
          </div>
          <div className="text-center lg:text-left">
            <p className="font-serif text-xs tracking-[0.28em] text-gold uppercase">
              Céad míle fáilte · Hong Kong
            </p>
            <h1 className="font-display mt-3 text-4xl leading-tight text-cream sm:text-5xl lg:text-6xl">
              The Irish heart
              <span className="block text-gold">of Hong Kong</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-cream/80 lg:mx-0">
              Since {site.founded}, St. Patrick&apos;s Society has been the
              gathering place for Irish people and friends of Ireland — to
              connect, celebrate, and contribute.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/events"
                className="inline-flex min-h-12 items-center rounded-full bg-saffron px-6 text-sm font-semibold text-ink hover:bg-gold"
              >
                See upcoming events
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-12 items-center rounded-full border border-gold/45 px-6 text-sm text-gold hover:bg-gold/10"
              >
                Our story
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <EventList events={upcomingEvents} />
      </section>

      <section className="border-y border-gold/15 bg-forest/35">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-center text-center">
            <ShamrockMark className="h-7 w-7 text-saffron" />
            <h2 className="font-display mt-3 text-3xl text-cream sm:text-4xl">
              A society, not a mailing list
            </h2>
            <p className="mt-3 max-w-2xl text-cream/75">
              We exist so Irish culture has a home in this city — lively when
              the Gala comes around, and just as glad to see you at a family
              barbecue.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-2xl border border-gold/20 bg-ink/40 px-6 py-8"
              >
                <h3 className="font-serif text-xl tracking-wide text-gold">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-cream/75">
                  {pillar.copy}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/about"
              className="text-sm font-semibold text-gold hover:underline"
            >
              Read more about the Society
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] border border-gold/25 bg-[linear-gradient(135deg,#0b3d2c_0%,#07120e_55%,#3a1d10_100%)]">
          <div className="grid items-center gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <p className="font-serif text-xs tracking-[0.22em] text-gold uppercase">
                St. Patrick&apos;s Gala 2026
              </p>
              <h2 className="font-display mt-2 text-3xl text-cream sm:text-4xl">
                The night is over. The album is open.
              </h2>
              <p className="mt-4 max-w-xl text-cream/78">
                Hong Kong Football Club, 14 March 2026 — Eleanor McEvoy, the
                Ireland v Scotland screening, and the highlight of the Irish
                calendar. Click through for the official photo gallery.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={site.galaAlbumUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold text-ink hover:bg-gold-bright"
                >
                  Open the 2026 album
                </a>
                <Link
                  href="/gala"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/40 px-6 text-sm text-gold hover:bg-gold/10"
                >
                  Gala &amp; gallery
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <Crest size={220} className="h-44 w-44 opacity-95" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="gold-rule mb-10" />
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl text-cream">Green Card</h2>
            <p className="mt-3 text-cream/75">
              Lifetime membership is {site.membership.price}. Members receive
              the Society newsletter, invitations, partner discounts around
              town, and a member rate at the Annual Ball.
            </p>
            <Link
              href="/contact#green-card"
              className="mt-5 inline-flex text-sm font-semibold text-gold hover:underline"
            >
              Ask about joining
            </Link>
          </div>
          <div>
            <h2 className="font-display text-3xl text-cream">Get in touch</h2>
            <p className="mt-3 text-cream/75">
              Volunteering, sponsorship, Green Card replacements, or a simple
              hello — the committee reads every note.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-5 inline-flex text-sm font-semibold text-gold hover:underline"
            >
              {site.email}
            </a>
          </div>
        </div>
        <Knot className="mx-auto mt-12 h-6 w-24 text-gold/60" />
      </section>
    </>
  );
}
