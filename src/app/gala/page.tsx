import type { Metadata } from "next";
import Link from "next/link";
import { Crest } from "@/components/crest";
import { NewTabHint } from "@/components/new-tab-hint";
import { galleryAlbums, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gala & gallery",
  description:
    "St. Patrick's Gala 2026 at Hong Kong Football Club, plus photo albums from Society gatherings.",
};

export default function GalaPage() {
  return (
    <article>
      <header className="relative overflow-hidden border-b border-gold/15">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(228,122,47,0.18),transparent_40%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_auto]">
          <div>
            <p className="font-serif text-xs tracking-[0.24em] text-gold uppercase">
              The highlight of the calendar
            </p>
            <h1 className="font-display mt-2 text-4xl text-cream sm:text-5xl">
              St. Patrick&apos;s Gala 2026
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-cream/78">
              Saturday 14 March at the Hong Kong Football Club — dinner, Eleanor
              McEvoy, and Ireland v Scotland on the screen. The ticket window
              is closed; the photographs are not.
            </p>
            <a
              href={site.galaAlbumUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex min-h-12 items-center rounded-full bg-saffron px-6 text-sm font-semibold text-ink hover:bg-gold"
            >
              Open the official photo album
              <NewTabHint />
            </a>
          </div>
          <Crest size={240} priority className="mx-auto h-48 w-48" />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-gold/20 bg-forest/30 px-5 py-6">
            <h2 className="font-serif text-gold">When &amp; where</h2>
            <p className="mt-3 text-sm text-cream/75">
              14 March 2026, 6:30pm–12:30am
              <br />
              Hong Kong Football Club
              <br />
              3 Sports Road, Happy Valley
            </p>
          </article>
          <article className="rounded-2xl border border-gold/20 bg-forest/30 px-5 py-6">
            <h2 className="font-serif text-gold">On the night</h2>
            <p className="mt-3 text-sm text-cream/75">
              Eleanor McEvoy — songwriter of{" "}
              <em>A Woman&apos;s Heart</em> — plus a live screening of Ireland
              v Scotland in the middle of the festivities.
            </p>
          </article>
          <article className="rounded-2xl border border-gold/20 bg-forest/30 px-5 py-6">
            <h2 className="font-serif text-gold">Tickets</h2>
            <p className="mt-3 text-sm text-cream/75">
              Sales for 2026 have closed. For next year&apos;s ball, Green Card
              holders receive the member rate. Enquiries:{" "}
              <a href={`mailto:${site.email}`} className="text-gold hover:underline">
                {site.email}
              </a>
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-gold/15 bg-forest/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl text-cream">Photo gallery</h2>
          <p className="mt-3 max-w-2xl text-cream/70">
            Nights we have already danced — and one album you can open now.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {galleryAlbums.map((album) => (
              <li key={`${album.title}-${album.date}`}>
                {album.href ? (
                  <a
                    href={album.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-gold/35 bg-ink/50 px-5 py-4 transition-colors hover:bg-gold/10"
                  >
                    <span>
                      <span className="block font-medium text-cream">
                        {album.title}
                      </span>
                      <span className="text-sm text-cream/70">{album.date}</span>
                    </span>
                    <span className="text-sm font-semibold text-gold">
                      Open album
                      <NewTabHint />
                    </span>
                  </a>
                ) : (
                  <div className="flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-gold/15 bg-ink/30 px-5 py-4">
                    <span>
                      <span className="block text-cream">{album.title}</span>
                      <span className="text-sm text-cream/70">{album.date}</span>
                    </span>
                    <span className="text-xs tracking-wide text-cream/70 uppercase">
                      Archive
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-cream/70">
            Have photographs from a Society event? Send a note to{" "}
            <a href={`mailto:${site.email}`} className="text-gold hover:underline">
              {site.email}
            </a>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Link href="/events" className="text-sm font-semibold text-gold hover:underline">
          Back to upcoming events
        </Link>
      </section>
    </article>
  );
}
