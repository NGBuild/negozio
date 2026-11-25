"use client";
import Link from "next/link";
import { startTransition, useActionState } from "react";
import { placeOrder } from "./actions";
import type { CheckoutState, FieldErrors } from "./schema";

// Un campo del form con etichetta ed eventuale messaggio d'errore.
// "autoComplete" dice al browser cosa contiene il campo: così può compilarlo
// da solo. Meno digitazione = meno carrelli abbandonati.
function Field(props: {
  name: keyof FieldErrors;
  label: string;
  errors?: FieldErrors;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
  maxLength?: number;
  inputMode?: "numeric" | "email" | "tel" | "text";
}) {
  const error = props.errors?.[props.name]?.[0];
  return (
    <label className={`field ${props.className ?? ""}`}>
      <span>{props.label}{props.required !== false && " *"}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        autoComplete={props.autoComplete}
        required={props.required !== false}
        maxLength={props.maxLength}
        inputMode={props.inputMode}
        aria-invalid={!!error}
      />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function CheckoutForm({ expectedTotalCents }: { expectedTotalCents: number }) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(placeOrder, null);
  const errors = state?.fieldErrors;

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        // Come nella Lezione 2: evitiamo il reset automatico del form,
        // così in caso di errore il cliente non deve riscrivere tutto.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="checkout-form"
      noValidate // la validazione la fa il server (e il browser non mostra i suoi popup)
    >
      <h2>Contatti</h2>
      <Field name="email" label="Email" type="email" autoComplete="email" inputMode="email" errors={errors} className="full" />

      <h2>Indirizzo di spedizione</h2>
      <div className="fields">
        <Field name="firstName" label="Nome" autoComplete="given-name" errors={errors} />
        <Field name="lastName" label="Cognome" autoComplete="family-name" errors={errors} />
        <Field name="address" label="Via e numero civico" autoComplete="address-line1" errors={errors} className="full" />
        <Field name="postalCode" label="CAP" autoComplete="postal-code" inputMode="numeric" maxLength={5} errors={errors} />
        <Field name="city" label="Città" autoComplete="address-level2" errors={errors} />
        <Field name="province" label="Provincia" autoComplete="address-level1" maxLength={2} errors={errors} />
        <Field name="phone" label="Telefono (per il corriere)" type="tel" autoComplete="tel" required={false} errors={errors} />
      </div>

      <input type="hidden" name="expectedTotalCents" value={expectedTotalCents} />

      <label className="terms">
        <input type="checkbox" name="terms" />
        <span>
          Ho letto e accetto le <Link href="#" className="link">condizioni di vendita</Link> e
          l&apos;<Link href="#" className="link">informativa privacy</Link> *
        </span>
      </label>
      {errors?.terms && <small className="field-error">{errors.terms[0]}</small>}

      {state?.error && <p className="notice error" role="alert">{state.error}</p>}

      {/* Codice del Consumo, art. 51: il pulsante finale deve dire chiaramente che si
          sta pagando, con la dicitura «ordine con obbligo di pagare» o equivalente. */}
      <button type="submit" className="btn btn-block" disabled={pending}>
        {pending ? "Invio dell'ordine…" : "Ordine con obbligo di pagare"}
      </button>
    </form>
  );
}
