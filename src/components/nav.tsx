"use client";
// Top navigation with the current page highlighted.
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Painel" },
  { href: "/bikes", label: "Bikes" },
  { href: "/pedais", label: "Pedais" },
  { href: "/fonte", label: "Fonte" },
  { href: "/mercado", label: "Mercado" },
  { href: "/sonhos", label: "Sonhos" },
  { href: "/notificacoes", label: "Avisos" },
  { href: "/ajuda", label: "Ajuda" },
];

export function NavLinks({ isAdmin }: { isAdmin?: boolean }) {
  const path = usePathname();
  const items = isAdmin ? [...ITEMS, { href: "/admin", label: "Catálogo" }] : ITEMS;
  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
  return (
    <nav className="nav" aria-label="Principal">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
