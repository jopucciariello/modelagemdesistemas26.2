"use client";
// Top navigation with the current page highlighted. The items come from the roles of the account (RB24).
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/roles";

/** The most specific item wins, so /mercado/meus lights "Minha loja" and not "Mercado" too. */
export function activeHref(path: string, items: NavItem[]): string | null {
  const matches = items.filter((i) => {
    if (i.href === "/") return path === "/";
    if (i.href === "/configuracoes") return path === i.href || path.startsWith("/fonte");
    return path === i.href || path.startsWith(`${i.href}/`);
  });
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const current = activeHref(usePathname(), items);
  return (
    <nav className="nav" aria-label="Principal">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.href === current ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
