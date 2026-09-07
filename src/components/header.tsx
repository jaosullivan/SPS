"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Crest } from "@/components/crest";
import { nav, site } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-sm"
          aria-label={`${site.name} home`}
          onClick={() => setOpen(false)}
        >
          <Crest size={48} priority className="h-12 w-12 shrink-0" />
          <span className="min-w-0">
            <span className="font-serif block text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
              St. Patrick&apos;s Society
            </span>
            <span className="block text-sm text-cream/80">Hong Kong · since 1931</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-2 text-sm tracking-wide transition-colors ${
                  active
                    ? "bg-forest text-gold"
                    : "text-cream/85 hover:bg-forest/60 hover:text-gold-bright"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="ml-2 rounded-full bg-saffron px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold"
          >
            Write to us
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold lg:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="text-lg leading-none">
            {open ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {open ? (
        <div
          id={panelId}
          className="border-t border-gold/20 bg-ink px-4 py-4 lg:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-3 text-base ${
                    active ? "bg-forest text-gold" : "text-cream"
                  }`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/contact"
              className="mt-2 rounded-full bg-saffron px-4 py-3 text-center text-base font-semibold text-ink"
              onClick={() => setOpen(false)}
            >
              Write to us
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
