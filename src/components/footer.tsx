import Link from "next/link";
import { Crest } from "@/components/crest";
import { Knot } from "@/components/ornament";
import { nav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gold/20 bg-[#06130e]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <Crest size={72} className="h-[72px] w-[72px]" />
            <span>
              <span className="font-serif block text-sm tracking-[0.16em] text-gold uppercase">
                St. Patrick&apos;s Society
              </span>
              <span className="text-cream/75">Hong Kong</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
            The Irish community in Hong Kong since {site.founded} — a place to
            connect, celebrate, and contribute.
          </p>
          <Knot className="mt-5 h-6 w-20 text-gold/70" />
        </div>

        <div>
          <h2 className="font-serif text-xs tracking-[0.2em] text-gold uppercase">
            Visit
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-cream/80 transition-colors hover:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xs tracking-[0.2em] text-gold uppercase">
            Reach us
          </h2>
          <a
            href={`mailto:${site.email}`}
            className="mt-3 inline-block text-sm text-gold-bright hover:underline"
          >
            {site.email}
          </a>
          <ul className="mt-4 flex flex-wrap gap-3 text-sm">
            <li>
              <a
                href={site.social.instagram}
                className="text-cream/80 hover:text-gold"
                rel="noreferrer"
                target="_blank"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={site.social.facebook}
                className="text-cream/80 hover:text-gold"
                rel="noreferrer"
                target="_blank"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href={site.social.x}
                className="text-cream/80 hover:text-gold"
                rel="noreferrer"
                target="_blank"
              >
                X
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gold/15 px-4 py-5 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} {site.name}. Replacing the previous Wix
        site at stpatrickshk.com.
      </div>
    </footer>
  );
}
