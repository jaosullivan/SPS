import type { Metadata } from "next";
import { EventList } from "@/components/event-list";
import { upcomingEvents } from "@/lib/events";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming St. Patrick's Society Hong Kong events for members and families — galas, gatherings, and everything in between.",
};

const yearShape = [
  {
    title: "The Gala Ball",
    copy: "The highlight of the Hong Kong Irish calendar — dinner, music, and a room that feels like home.",
  },
  {
    title: "Family days",
    copy: "Treasure hunts, beach barbecues, and gatherings where children are as welcome as the craic.",
  },
  {
    title: "Sport & the turf",
    copy: "Horseracing at Happy Valley and screenings when Ireland takes the field.",
  },
  {
    title: "Culture & classes",
    copy: "Quizzes, Irish language sessions, and quieter evenings that keep the culture close.",
  },
] as const;

export default function EventsPage() {
  return (
    <article>
      <header className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="font-serif text-xs tracking-[0.24em] text-gold uppercase">
          For members &amp; families
        </p>
        <h1 className="font-display mt-2 text-4xl text-cream sm:text-5xl">
          The year’s gatherings
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-cream/78">
          From treasure hunts to beach barbecues, horseracing to formal balls,
          quizzes to Irish language classes — there is a lot in store for
          members and families. Dates land here first, and on our social
          channels.
        </p>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <EventList
          events={upcomingEvents}
          emptyHeading="No events posted at the moment"
          showYearLink={false}
        />
      </section>

      <section className="border-t border-gold/15 bg-forest/25">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl text-cream">
            What a typical year holds
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {yearShape.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-gold/20 bg-ink/40 px-6 py-6"
              >
                <h3 className="font-serif text-lg text-gold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/75">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-10 text-sm text-cream/70">
            Volunteering and enquiries:{" "}
            <a
              href={`mailto:${site.email}`}
              className="text-gold hover:underline"
            >
              {site.email}
            </a>
          </p>
        </div>
      </section>
    </article>
  );
}
