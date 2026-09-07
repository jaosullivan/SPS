import type { Metadata } from "next";
import { Crest } from "@/components/crest";
import { NewTabHint } from "@/components/new-tab-hint";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Write to St. Patrick's Society Hong Kong at ${site.email} — events, volunteering, Green Card, and general enquiries.`,
};

const channels = [
  {
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
    hint: "The surest way to reach the committee",
  },
  {
    label: "Instagram",
    value: "@stpatrickshk",
    href: site.social.instagram,
  },
  {
    label: "Facebook",
    value: "St. Patrick's Society Hong Kong",
    href: site.social.facebook,
  },
  {
    label: "X",
    value: "@StPatricks_HK",
    href: site.social.x,
  },
] as const;

export default function ContactPage() {
  return (
    <article>
      <header className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
          <Crest size={140} priority className="h-28 w-28" />
          <div>
            <p className="font-serif text-xs tracking-[0.24em] text-gold uppercase">
              Contact
            </p>
            <h1 className="font-display mt-2 text-4xl text-cream sm:text-5xl">
              Write to the Society
            </h1>
            <p className="mt-4 max-w-xl text-lg text-cream/78">
              Events, volunteering, sponsorship, Green Card replacements, or a
              simple céad míle fáilte — we read every message.
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 sm:px-6 md:grid-cols-2">
        {channels.map((channel) => (
          <a
            key={channel.label}
            href={channel.href}
            {...(channel.href.startsWith("http")
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
            className="rounded-2xl border border-gold/20 bg-forest/30 px-6 py-6 transition-colors hover:border-gold/50 hover:bg-forest/50"
          >
            <p className="font-serif text-xs tracking-[0.18em] text-gold uppercase">
              {channel.label}
            </p>
            <p className="mt-2 text-xl text-cream">{channel.value}</p>
            {"hint" in channel ? (
              <p className="mt-2 text-sm text-cream/70">{channel.hint}</p>
            ) : null}
            {channel.href.startsWith("http") ? <NewTabHint /> : null}
          </a>
        ))}
      </section>

      <section
        id="green-card"
        className="border-y border-gold/15 bg-forest/25"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl text-cream">Green Card membership</h2>
          <p className="mt-4 max-w-2xl text-cream/75">
            A lifetime membership is {site.membership.price}. The card brings
            partner discounts (typically 10–25%) at restaurants, bars, and
            shops around Hong Kong, the monthly newsletter, invitations to
            Society events, and a member rate at the Annual Ball.
          </p>
          <p className="mt-4 max-w-2xl text-cream/75">
            To join, replace a lost card, or upgrade an older white card, email{" "}
            <a href={`mailto:${site.email}`} className="text-gold hover:underline">
              {site.email}
            </a>
            . Terms apply to partner offers.
          </p>
          <a
            href={`mailto:${site.email}?subject=Green%20Card%20membership`}
            className="mt-7 inline-flex min-h-12 items-center rounded-full bg-saffron px-6 text-sm font-semibold text-ink hover:bg-gold"
          >
            Email about a Green Card
          </a>
        </div>
      </section>
    </article>
  );
}
