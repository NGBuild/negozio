// Funzioni di LETTURA del carrello (usabili da qualsiasi Server Component).
// Le funzioni che MODIFICANO il carrello stanno in app/carrello/actions.ts.
import { cookies } from "next/headers";
import { db } from "./db";

export const CART_COOKIE = "cart_id";
export const MAX_QTY_PER_ITEM = 10; // limite anti-abuso (e anti-errore di battitura)

export async function getCartId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

export async function getCart() {
  const id = await getCartId();
  if (!id) return null;
  return db.cart.findUnique({
    where: { id },
    include: {
      items: {
        include: { variant: { include: { product: true } } },
        orderBy: { id: "asc" },
      },
    },
  });
}

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof getCart>>>;

// Il totale si calcola SEMPRE sul server, dai prezzi nel database.
export function cartSubtotal(cart: CartWithItems): number {
  return cart.items.reduce((sum, item) => sum + item.variant.priceCents * item.quantity, 0);
}

// Numero di pezzi nel carrello, per il badge nell'header.
export async function getCartCount(): Promise<number> {
  const id = await getCartId();
  if (!id) return 0;
  const result = await db.cartItem.aggregate({ where: { cartId: id }, _sum: { quantity: true } });
  return result._sum.quantity ?? 0;
}
