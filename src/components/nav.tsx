"use client";
// Top navigation with the current page highlighted.
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Painel" },
  { href: "/pedais", label: "Pedais" },
  { href: "/mercado", label: "Mercado" },
  { href: "/sonhos", label: "Sonhos" },
  { href: "/notificacoes", label: "Avisos" },
  { href: "/oficinas", label: "Oficinas" },
  { href: "/ajuda", label: "Ajuda" },
  { href: "/configuracoes", label: "Configurações" },
];

export function NavLinks({ isAdmin }: { isAdmin?: boolean }) {
  const path = usePathname();
  const items = isAdmin ? [...ITEMS, { href: "/admin", label: "Catálogo" }] : ITEMS;
  const active = (href: string) => {
    if (href === "/") return path === "/";
    if (href === "/configuracoes") return path === href || path.startsWith("/fonte");
    return path === href || path.startsWith(`${href}/`);
  };
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
