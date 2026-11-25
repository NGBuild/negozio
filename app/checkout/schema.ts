// Validazione dei dati del checkout con Zod.
// Lo schema descrive com'è fatto un dato VALIDO; Zod controlla e
// restituisce errori leggibili campo per campo.
import { z } from "zod";

export const checkoutSchema = z.object({
  email: z.string().trim().toLowerCase().email("Inserisci un'email valida"),
  firstName: z.string().trim().min(1, "Inserisci il nome").max(80),
  lastName: z.string().trim().min(1, "Inserisci il cognome").max(80),
  address: z.string().trim().min(5, "Inserisci via e numero civico").max(200),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Il CAP è di 5 cifre"),
  city: z.string().trim().min(2, "Inserisci la città").max(80),
  province: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Sigla di 2 lettere, es. MI"),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? v : null)), // campo vuoto → null nel database
  // Le checkbox HTML inviano "on" se spuntate, niente se non spuntate
  terms: z.literal("on", { errorMap: () => ({ message: "Devi accettare le condizioni di vendita" }) }),
  // Il totale che il cliente ha VISTO (vedi actions.ts per il perché)
  expectedTotalCents: z.coerce.number().int(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type FieldErrors = Partial<Record<keyof CheckoutInput, string[]>>;
export type CheckoutState = { error?: string; fieldErrors?: FieldErrors } | null;
