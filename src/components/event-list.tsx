import { EmptyEvents } from "@/components/empty-events";
import type { SocietyEvent } from "@/lib/events";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-HK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function EventList({
  events,
  emptyHeading,
  showYearLink = true,
}: {
  events: SocietyEvent[];
  emptyHeading?: string;
  showYearLink?: boolean;
}) {
  if (events.length === 0) {
    return (
      <EmptyEvents heading={emptyHeading} showYearLink={showYearLink} />
    );
  }

  return (
    <div>
      <h2 className="font-display mb-6 text-3xl text-cream">Upcoming events</h2>
      <ul className="grid gap-4">
        {events.map((event) => (
          <li
            key={event.id}
            className="rounded-2xl border border-gold/25 bg-forest/35 px-5 py-5 sm:px-7"
          >
            <p className="font-serif text-xs tracking-[0.18em] text-gold uppercase">
              {formatWhen(event.start)}
            </p>
            <h3 className="mt-2 text-xl text-cream">{event.title}</h3>
            <p className="mt-1 text-sm text-cream/70">{event.venue}</p>
            <p className="mt-3 text-sm leading-relaxed text-cream/80">
              {event.summary}
            </p>
            {event.href ? (
              <a
                href={event.href}
                className="mt-4 inline-flex text-sm font-semibold text-gold hover:underline"
              >
                {event.title} details
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
