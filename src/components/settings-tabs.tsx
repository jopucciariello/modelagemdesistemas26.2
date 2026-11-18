"use client";
// Tabs of the user settings: Fonte dos pedais and Adicionar bike.
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/fonte", label: "Fonte dos pedais" },
  { href: "/configuracoes", label: "Adicionar bike" },
  { href: "/estoque", label: "Estoque" },
];

export function SettingsTabs() {
  const path = usePathname();
  return (
    <nav className="nav settings-tabs" aria-label="Configurações">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path === t.href || path.startsWith(`${t.href}/`) ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
