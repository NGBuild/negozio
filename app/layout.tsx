import type { Metadata } from "next";
import Link from "next/link";
import { getCartCount } from "@/lib/cart";
import "./globals.css";

export const metadata: Metadata = {
  title: "Il Mio Negozio",
  description: "Un e-commerce costruito per imparare",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cartCount = await getCartCount(); // letto dal cookie a ogni richiesta

  return (
    <html lang="it">
      <body>
        <header className="header">
          <Link href="/" className="logo">🛍️ Il Mio Negozio</Link>
          <nav>
            <Link href="/carrello" className="cart-link">
              🛒 Carrello
              {cartCount > 0 && <span className="badge" aria-label={`${cartCount} articoli`}>{cartCount}</span>}
            </Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
