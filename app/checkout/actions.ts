"use server";
// LA FUNZIONE PIÙ IMPORTANTE DEL NEGOZIO: trasforma un carrello in un ordine.
//
// Deve essere ATOMICA: o succede TUTTO (scalare il magazzino di ogni articolo,
// creare l'ordine, svuotare il carrello) o NIENTE. Mai a metà.
// Per questo usiamo una TRANSAZIONE del database.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { CART_COOKIE, getCartId } from "@/lib/cart";
import { computeTotals } from "@/lib/pricing";
import { checkoutSchema, type CheckoutState } from "./schema";

// Errore "previsto" (colpa della situazione, non un bug): lo mostriamo al cliente.
class CheckoutError extends Error {}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  // ── 1. Validazione dei dati del cliente ──────────────────────────────
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Controlla i campi evidenziati.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { expectedTotalCents, terms: _terms, ...customer } = parsed.data;

  const cartId = await getCartId();
  if (!cartId) return { error: "Il carrello è vuoto." };

  let publicId: string;
  try {
    // ── 2. Transazione: tutto ciò che succede qui dentro è "tutto o niente" ──
    const order = await db.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { variant: { include: { product: true } } }, orderBy: { id: "asc" } } },
      });
      // Carrello vuoto = probabilmente doppio click su "Ordina": il primo invio l'ha già svuotato
      if (!cart || cart.items.length === 0) throw new CheckoutError("Il carrello è vuoto.");

      // ── 3. Scala il magazzino, CONDIZIONATAMENTE ──
      // "Togli N pezzi SOLO SE ce ne sono almeno N" in un'unica istruzione SQL:
      //   UPDATE Variant SET stock = stock - N WHERE id = ? AND stock >= N
      // Se nel frattempo un altro cliente ha comprato gli ultimi pezzi,
      // count = 0 → lanciamo un errore → la transazione annulla TUTTO,
      // anche gli articoli già scalati nei giri precedenti del ciclo.
      for (const item of cart.items) {
        const { variant } = item;
        if (!variant.product.active) {
          throw new CheckoutError(`"${variant.product.name}" non è più in vendita. Rimuovilo dal carrello.`);
        }
        const result = await tx.variant.updateMany({
          where: { id: variant.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new CheckoutError(
            `"${variant.product.name} (${variant.name})" non è più disponibile nella quantità richiesta. Aggiorna il carrello.`,
          );
        }
      }

      // ── 4. Totali calcolati SUL SERVER, dai prezzi nel database ──
      const subtotal = cart.items.reduce((sum, i) => sum + i.variant.priceCents * i.quantity, 0);
      const totals = computeTotals(subtotal);

      // Il browser ci ha detto quale totale ha VISTO il cliente. Non lo usiamo MAI
      // per addebitare (potrebbe essere falsificato), solo per un controllo:
      // se un prezzo è cambiato mentre compilava il form, lo avvisiamo invece di
      // fargli pagare una cifra diversa da quella che ha letto.
      if (totals.totalCents !== expectedTotalCents) {
        throw new CheckoutError("Alcuni prezzi sono cambiati. Controlla il nuovo riepilogo e conferma di nuovo.");
      }

      // ── 5. Crea l'ordine con la COPIA (snapshot) di ogni riga ──
      const created = await tx.order.create({
        data: {
          ...customer,
          ...totals,
          termsAcceptedAt: new Date(),
          items: {
            create: cart.items.map((i) => ({
              variantId: i.variant.id,
              productName: i.variant.product.name,
              variantName: i.variant.name,
              sku: i.variant.sku,
              unitPriceCents: i.variant.priceCents,
              quantity: i.quantity,
            })),
          },
        },
      });

      // ── 6. Svuota il carrello (le righe si cancellano a cascata) ──
      await tx.cart.delete({ where: { id: cart.id } });
      return created;
    });
    publicId = order.publicId;
  } catch (e) {
    if (e instanceof CheckoutError) {
      revalidatePath("/checkout"); // il riepilogo va ricaricato con i dati aggiornati
      return { error: e.message };
    }
    throw e; // errore inatteso (bug, database giù...): lascia che Next.js mostri la pagina d'errore
  }

  // ── 7. Fuori dalla transazione: pulizia e redirect ──
  (await cookies()).delete(CART_COOKIE);
  revalidatePath("/", "layout");
  // Nota: redirect() funziona lanciando un'eccezione speciale, per questo
  // si chiama FUORI dal try/catch (altrimenti il catch la intercetterebbe).
  redirect(`/ordini/${publicId}`);
}
