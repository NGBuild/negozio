import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Il Mio Negozio",
  description: "Un e-commerce costruito per imparare",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="header">
          <Link href="/" className="logo">🛍️ Il Mio Negozio</Link>
          <nav>{/* Lezione 2: qui arriverà il carrello */}</nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
