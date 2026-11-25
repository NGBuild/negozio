// Stati dell'ordine (macchina a stati).
// Un ordine può solo andare "avanti" lungo queste frecce:
//
//   PENDING_PAYMENT ──► PAID ──► SHIPPED ──► DELIVERED
//          │              │
//          └──────────────┴──► CANCELLED
//
// Nella Lezione 4 sarà Stripe (tramite webhook) a portare l'ordine in PAID.

export const ORDER_STATUSES = ["PENDING_PAYMENT", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "In attesa di pagamento",
  PAID: "Pagato",
  SHIPPED: "Spedito",
  DELIVERED: "Consegnato",
  CANCELLED: "Annullato",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] ?? status;
}

// Numero d'ordine leggibile per il cliente: 7 → "#000007"
export function orderNumber(id: number): string {
  return "#" + id.toString().padStart(6, "0");
}
