// Converte i centesimi in testo leggibile: 1990 → "19,90 €"
// La formattazione si fa SOLO quando si mostra il prezzo, mai nei calcoli.
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}
