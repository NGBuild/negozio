// Pagina di conferma/stato dell'ordine: /ordini/clx3k9...
// Chi conosce il publicId (casuale, non indovinabile) può vedere l'ordine.
// Nella Lezione 7 lo invieremo per email al cliente.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { orderNumber, statusLabel } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Il tuo ordine · Il Mio Negozio", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const order = await db.order.findUnique({
    where: { publicId },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!order) notFound();

  // ⚠️ Tutto ciò che mostriamo qui viene dallo SNAPSHOT dell'ordine
  // (productName, unitPriceCents...), mai dalle tabelle Product/Variant.
  return (
    <div className="order">
      <p className="order-check">✅</p>
      <h1>Grazie, {order.firstName}!</h1>
      <p>
        Abbiamo ricevuto il tuo ordine <strong>{orderNumber(order.id)}</strong> del{" "}
        {order.createdAt.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}.
      </p>
      <p>
        Stato: <span className={`status status-${order.status}`}>{statusLabel(order.status)}</span>
      </p>
      {order.status === "PENDING_PAYMENT" && (
        <p className="notice">💳 Il pagamento online arriva nella Lezione 4 (Stripe).</p>
      )}

      <div className="order-grid">
        <section className="summary">
          <h2>Articoli</h2>
          <ul className="summary-items">
            {order.items.map((i) => (
              <li key={i.id}>
                <span>
                  {i.quantity}× {i.productName} <span className="muted">({i.variantName})</span>
                  <br />
                  <small className="muted">SKU {i.sku} · {formatPrice(i.unitPriceCents)} cad.</small>
                </span>
                <span>{formatPrice(i.unitPriceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="row"><span>Subtotale</span><span>{formatPrice(order.subtotalCents)}</span></div>
          <div className="row">
            <span>Spedizione</span>
            <span>{order.shippingCents === 0 ? "Gratis" : formatPrice(order.shippingCents)}</span>
          </div>
          <div className="row total"><span>Totale</span><strong>{formatPrice(order.totalCents)}</strong></div>
          <p className="muted small">di cui IVA {formatPrice(order.vatCents)}</p>
        </section>

        <section className="summary">
          <h2>Spedizione a</h2>
          <address>
            {order.firstName} {order.lastName}<br />
            {order.address}<br />
            {order.postalCode} {order.city} ({order.province})<br />
            {order.phone && <>Tel. {order.phone}<br /></>}
          </address>
          <p className="muted small">Gli aggiornamenti arriveranno a {order.email} (email: Lezione 7)</p>
        </section>
      </div>
    </div>
  );
}
