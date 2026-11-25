// Pagina /carrello. Server Component: legge il carrello dal DB tramite il cookie.
// I pulsanti −, + e Rimuovi sono normali <form> collegati a una Server Action:
// funzionano anche con JavaScript disattivato ("progressive enhancement").
import Link from "next/link";
import type { Metadata } from "next";
import { getCart, cartSubtotal, MAX_QTY_PER_ITEM } from "@/lib/cart";
import { formatPrice } from "@/lib/money";
import { updateQuantity } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Carrello · Il Mio Negozio" };

export default async function CartPage() {
  const cart = await getCart();

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <h1>Carrello</h1>
        <p>Il carrello è vuoto. <Link href="/" className="link">Torna al catalogo →</Link></p>
      </>
    );
  }

  // Tra il momento in cui hai aggiunto un articolo e adesso, il magazzino può
  // essere cambiato (altri clienti hanno comprato). Lo segnaliamo.
  const problems = cart.items.filter((i) => !i.variant.product.active || i.quantity > i.variant.stock);

  return (
    <>
      <h1>Carrello</h1>
      <div className="cart">
        <ul className="cart-items">
          {cart.items.map((item) => {
            const { variant } = item;
            const max = Math.min(variant.stock, MAX_QTY_PER_ITEM);
            return (
              <li key={item.id}>
                <img src={variant.product.imageUrl} alt="" />
                <div>
                  <Link href={`/prodotti/${variant.product.slug}`}><strong>{variant.product.name}</strong></Link>
                  <div className="muted">{variant.name} · {formatPrice(variant.priceCents)} cad.</div>
                  {item.quantity > variant.stock && (
                    <div className="soldout">
                      {variant.stock === 0 ? "Non più disponibile" : `Disponibili solo ${variant.stock}`}
                    </div>
                  )}
                  <form action={updateQuantity}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button name="quantity" value={0} className="link-btn">Rimuovi</button>
                  </form>
                </div>

                <form action={updateQuantity} className="qty">
                  <input type="hidden" name="itemId" value={item.id} />
                  <button name="quantity" value={item.quantity - 1} aria-label="Diminuisci">−</button>
                  <span aria-label="Quantità">{item.quantity}</span>
                  <button name="quantity" value={item.quantity + 1} aria-label="Aumenta" disabled={item.quantity >= max}>+</button>
                </form>

                <strong className="line-total">{formatPrice(variant.priceCents * item.quantity)}</strong>
              </li>
            );
          })}
        </ul>

        <aside className="summary">
          <div className="row"><span>Subtotale</span><strong>{formatPrice(cartSubtotal(cart))}</strong></div>
          <p className="muted">Spedizione calcolata al checkout. Prezzi IVA inclusa.</p>
          {problems.length > 0 && <p className="notice error">Correggi gli articoli segnalati per procedere.</p>}
          {problems.length > 0 ? (
            <button className="btn btn-block" disabled>Procedi al checkout</button>
          ) : (
            <Link href="/checkout" className="btn btn-block">Procedi al checkout</Link>
          )}
        </aside>
      </div>
    </>
  );
}
