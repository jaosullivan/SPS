import Link from "next/link";
import { ShamrockMark } from "@/components/ornament";
import { site } from "@/lib/site";

type EmptyEventsProps = {
  heading?: string;
  compact?: boolean;
  showYearLink?: boolean;
};

export function EmptyEvents({
  heading = "Nothing on the diary just now",
  compact = false,
  showYearLink = true,
}: EmptyEventsProps) {
  return (
    <div
      className={`rounded-3xl border border-gold/25 bg-forest/40 text-center ${
        compact ? "px-5 py-10" : "px-6 py-14 sm:px-10"
      }`}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/35 bg-ink/50 text-saffron">
        <ShamrockMark className="h-8 w-8" />
      </div>
      <p className="font-serif mt-5 text-xs tracking-[0.22em] text-gold uppercase">
        Upcoming events
      </p>
      <h2 className="font-display mt-2 text-2xl text-cream sm:text-3xl">
        {heading}
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-pretty text-cream/75">
        Treasure hunts, beach barbecues, Happy Valley nights, quizzes, Irish
        classes, and the Gala — the year fills in as the committee confirms
        dates. Follow our social channels, or write to us to volunteer.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={`mailto:${site.email}`}
          className="inline-flex min-h-11 items-center rounded-full bg-saffron px-5 text-sm font-semibold text-ink hover:bg-gold"
        >
          Email {site.email}
        </a>
        {showYearLink ? (
          <Link
            href="/events"
            className="inline-flex min-h-11 items-center rounded-full border border-gold/40 px-5 text-sm text-gold hover:bg-gold/10"
          >
            What a typical year looks like
          </Link>
        ) : (
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center rounded-full border border-gold/40 px-5 text-sm text-gold hover:bg-gold/10"
          >
            Volunteer or enquire
          </Link>
        )}
      </div>
    </div>
  );
}
