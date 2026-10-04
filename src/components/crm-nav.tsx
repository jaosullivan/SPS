"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CrmNav({
  links,
}: {
  links: readonly { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="CRM" className="mt-6 flex flex-wrap gap-2">
      {links.map((link) => {
        const active =
          link.href === "/crm" ? pathname === "/crm" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3.5 py-2 text-sm tracking-wide ${
              active
                ? "bg-forest text-gold"
                : "text-cream/85 hover:bg-forest/60 hover:text-gold-bright"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
