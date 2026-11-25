"use server";
// SERVER ACTIONS: funzioni che girano sul server ma si possono collegare
// direttamente a un <form> nel browser. Next.js crea l'endpoint HTTP per noi.
//
// ⚠️ Regola di sicurezza n.1 dell'e-commerce: NON FIDARTI MAI DEL BROWSER.
// Dal form arrivano solo "quale variante" e "quanti pezzi". Prezzo, disponibilità
// e proprietario del carrello li decide il server leggendo il database e il cookie.
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { CART_COOKIE, MAX_QTY_PER_ITEM, getCartId } from "@/lib/cart";

export type AddToCartState = { ok: boolean; message: string } | null;

function toInt(value: FormDataEntryValue | null): number {
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}

async function getOrCreateCartId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) {
    // Il cookie potrebbe puntare a un carrello cancellato (o essere stato manomesso)
    const cart = await db.cart.findUnique({ where: { id: existing }, select: { id: true } });
    if (cart) return cart.id;
  }
  const cart = await db.cart.create({ data: {} });
  store.set(CART_COOKIE, cart.id, {
    httpOnly: true, // JavaScript nella pagina non può leggerlo (protegge da attacchi XSS)
    sameSite: "lax", // non viene inviato da form di altri siti (protegge da CSRF)
    secure: process.env.NODE_ENV === "production", // solo HTTPS in produzione
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 giorni
  });
  return cart.id;
}

export async function addToCart(_prev: AddToCartState, formData: FormData): Promise<AddToCartState> {
  const variantId = toInt(formData.get("variantId"));
  const quantity = toInt(formData.get("quantity") ?? "1");

  // 1. Validazione dell'input
  if (Number.isNaN(variantId)) return { ok: false, message: "Scegli una variante." };
  if (!(quantity >= 1 && quantity <= MAX_QTY_PER_ITEM)) {
    return { ok: false, message: `La quantità deve essere tra 1 e ${MAX_QTY_PER_ITEM}.` };
  }

  // 2. Il prodotto esiste ed è in vendita?
  const variant = await db.variant.findUnique({ where: { id: variantId }, include: { product: true } });
  if (!variant || !variant.product.active) return { ok: false, message: "Prodotto non disponibile." };

  // 3. C'è abbastanza magazzino, contando anche quello che è già nel carrello?
  const cartId = await getOrCreateCartId();
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  const alreadyInCart = existing?.quantity ?? 0;
  const newQuantity = alreadyInCart + quantity;

  if (newQuantity > variant.stock) {
    if (variant.stock === 0) return { ok: false, message: "Questa variante è esaurita." };
    const note = alreadyInCart > 0 ? ` (ne hai già ${alreadyInCart} nel carrello)` : "";
    return { ok: false, message: `Disponibili solo ${variant.stock} pezzi${note}.` };
  }
  if (newQuantity > MAX_QTY_PER_ITEM) {
    return { ok: false, message: `Massimo ${MAX_QTY_PER_ITEM} pezzi per articolo.` };
  }

  // 4. Salva: "upsert" = crea la riga se non c'è, altrimenti aggiornala
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity },
    update: { quantity: newQuantity },
  });
  await db.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });

  // 5. Le pagine già renderizzate (es. il badge nell'header) vanno ricalcolate
  revalidatePath("/", "layout");
  return { ok: true, message: `Aggiunto: ${variant.product.name} (${variant.name})` };
}

// Usata dai pulsanti −, + e "Rimuovi" nella pagina carrello. quantity = 0 → rimuove.
export async function updateQuantity(formData: FormData): Promise<void> {
  const cartId = await getCartId();
  const itemId = toInt(formData.get("itemId"));
  const quantity = toInt(formData.get("quantity"));
  if (!cartId || Number.isNaN(itemId) || Number.isNaN(quantity)) return;

  // ⚠️ Filtriamo SEMPRE anche per cartId: senza, chiunque potrebbe inviare
  // l'id di una riga di un ALTRO carrello e modificarla.
  const item = await db.cartItem.findFirst({ where: { id: itemId, cartId }, include: { variant: true } });
  if (!item) return;

  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    const allowed = Math.min(quantity, item.variant.stock, MAX_QTY_PER_ITEM);
    if (allowed <= 0) await db.cartItem.delete({ where: { id: item.id } });
    else await db.cartItem.update({ where: { id: item.id }, data: { quantity: allowed } });
  }

  revalidatePath("/", "layout");
}
