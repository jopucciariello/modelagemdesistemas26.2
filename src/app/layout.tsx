import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GearLog",
  description: "Desgaste e manutenção preventiva das peças da sua bike, a partir do Strava.",
};

// RNF07: responsive, usable on mobile.
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
