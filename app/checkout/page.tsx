// Pagina /checkout: form con i dati del cliente + riepilogo dell'ordine.
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCart, cartSubtotal } from "@/lib/cart";
import { computeTotals, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import { formatPrice } from "@/lib/money";
import { CheckoutForm } from "./CheckoutForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout · Il Mio Negozio" };

export default async function CheckoutPage() {
  const cart = await getCart();
  if (!cart || cart.items.length === 0) redirect("/carrello");

  const hasProblems = cart.items.some((i) => !i.variant.product.active || i.quantity > i.variant.stock);
  if (hasProblems) redirect("/carrello"); // prima si sistema il carrello

  const totals = computeTotals(cartSubtotal(cart));

  return (
    <>
      <p><Link href="/carrello" className="link">← Torna al carrello</Link></p>
      <h1>Checkout</h1>
      <div className="cart">
        <CheckoutForm expectedTotalCents={totals.totalCents} />

        <aside className="summary">
          <h2>Riepilogo</h2>
          <ul className="summary-items">
            {cart.items.map((i) => (
              <li key={i.id}>
                <span>{i.quantity}× {i.variant.product.name} <span className="muted">({i.variant.name})</span></span>
                <span>{formatPrice(i.variant.priceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="row"><span>Subtotale</span><span>{formatPrice(totals.subtotalCents)}</span></div>
          <div className="row">
            <span>Spedizione</span>
            <span>{totals.shippingCents === 0 ? "Gratis" : formatPrice(totals.shippingCents)}</span>
          </div>
          {totals.shippingCents > 0 && (
            <p className="muted small">
              Spedizione gratuita da {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)}
            </p>
          )}
          <div className="row total"><span>Totale</span><strong>{formatPrice(totals.totalCents)}</strong></div>
          <p className="muted small">di cui IVA {formatPrice(totals.vatCents)}</p>
        </aside>
      </div>
    </>
  );
}
