import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// Aplica o tema salvo antes da primeira pintura (padrão: escuro, como o portfólio).
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}`;

export const metadata: Metadata = {
  title: "GearLog",
  description: "Desgaste e manutenção preventiva das peças da sua bike, a partir do Strava.",
};

// RNF07: responsive, usable on mobile.
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeToggle />
        {children}
        <footer>
          <small>
            Compatible with Strava. GearLog não é afiliado nem endossado pelo Strava. <a href="/privacidade">Privacidade</a>
          </small>
        </footer>
      </body>
    </html>
  );
}
