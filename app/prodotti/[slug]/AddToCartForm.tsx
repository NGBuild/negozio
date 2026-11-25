"use client";
// CLIENT COMPONENT: gira nel browser, quindi può avere stato e interattività
// (qui: il messaggio "Aggiunto!" e il pulsante disabilitato durante l'invio).
// Riceve dal server SOLO i dati che gli servono, tramite le props.
import Link from "next/link";
import { startTransition, useActionState } from "react";
import { addToCart } from "@/app/carrello/actions";
import { formatPrice } from "@/lib/money";

type VariantOption = { id: number; name: string; priceCents: number; stock: number };

function stockLabel(stock: number) {
  if (stock === 0) return <span className="soldout">Esaurito</span>;
  if (stock <= 3) return <span className="ok">Solo {stock} rimasti!</span>;
  return <span className="ok">Disponibile</span>;
}

export function AddToCartForm({ variants, maxQty }: { variants: VariantOption[]; maxQty: number }) {
  // useActionState collega il form alla Server Action e ci dà il suo ultimo risultato
  const [state, formAction, pending] = useActionState(addToCart, null);

  const firstAvailable = variants.find((v) => v.stock > 0);
  if (!firstAvailable) return <p className="soldout">Prodotto esaurito</p>;

  return (
    <form
      action={formAction} // funziona anche senza JavaScript (o prima che la pagina sia "idratata")
      onSubmit={(e) => {
        // Con JS attivo inviamo noi il form: così React 19 NON lo resetta dopo l'invio
        // e il cliente non perde la variante e la quantità che aveva scelto.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="add-form"
    >
      <fieldset className="variants">
        <legend>Scegli la variante</legend>
        {variants.map((v) => (
          <label key={v.id} className={v.stock === 0 ? "disabled" : ""}>
            <input
              type="radio"
              name="variantId"
              value={v.id}
              defaultChecked={v.id === firstAvailable.id}
              disabled={v.stock === 0}
            />
            <span>{v.name}</span>
            <strong>{formatPrice(v.priceCents)}</strong>
            {stockLabel(v.stock)}
          </label>
        ))}
      </fieldset>

      <div className="add-row">
        <label>
          Quantità{" "}
          <input type="number" name="quantity" min={1} max={maxQty} defaultValue={1} className="qty-input" />
        </label>
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Aggiungo…" : "Aggiungi al carrello"}
        </button>
      </div>

      {state && (
        <p className={state.ok ? "notice ok" : "notice error"} role="status">
          {state.message}
          {state.ok && (
            <>
              {" · "}
              <Link href="/carrello">Vai al carrello →</Link>
            </>
          )}
        </p>
      )}
    </form>
  );
}
