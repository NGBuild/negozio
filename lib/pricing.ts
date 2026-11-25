// Regole di prezzo del negozio, in UN SOLO posto.
// Carrello, checkout e ordine usano tutti queste funzioni: se le regole
// fossero duplicate, prima o poi il carrello mostrerebbe un totale e
// l'ordine ne addebiterebbe un altro.

export const SHIPPING_FLAT_CENTS = 490; // 4,90 €
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000; // spedizione gratis da 50 €
export const VAT_RATE_PERCENT = 22; // IVA ordinaria in Italia

export type Totals = {
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  vatCents: number;
};

export function shippingFor(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
}

// In Italia i prezzi ai privati si mostrano IVA INCLUSA.
// L'IVA si ricava "scorporandola" dal totale: totale × 22 / 122.
// Es. 122,00 € → di cui IVA 22,00 € (imponibile 100,00 €).
export function vatIncluded(totalCents: number): number {
  return Math.round((totalCents * VAT_RATE_PERCENT) / (100 + VAT_RATE_PERCENT));
}

export function computeTotals(subtotalCents: number): Totals {
  const shippingCents = shippingFor(subtotalCents);
  const totalCents = subtotalCents + shippingCents;
  return { subtotalCents, shippingCents, totalCents, vatCents: vatIncluded(totalCents) };
}
