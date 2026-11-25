# 🛍️ Negozio — e-commerce didattico

Un e-commerce costruito passo per passo per imparare come funziona davvero.

**Stack:** Next.js 15 · TypeScript · Prisma · SQLite (→ PostgreSQL in produzione) · Stripe (dalla Lezione 4)

## Avvio nel browser (consigliato, niente da installare)

1. Su GitHub clicca **Code → Codespaces → Create codespace on main**
2. Aspetta 2-3 minuti: installa tutto, crea il database e avvia il sito da solo
3. Il negozio si apre in un'anteprima (oppure: scheda **Porte** → porta 3000 → 🌐)

Quando hai finito chiudi la scheda: il Codespace si ferma da solo dopo 30 minuti di inattività.

## Avvio in locale

```bash
npm install
cp .env.example .env
npx prisma migrate dev   # crea il database e lo popola con i prodotti di esempio
npm run dev              # → http://localhost:3000
```

## Programma

| # | Lezione | Stato |
|---|---|---|
| 1 | Modello dati e catalogo | ✅ |
| 2 | Carrello | ✅ |
| 3 | Checkout e ordini | ✅ |
| 4 | Pagamenti con Stripe e webhook | ⏳ |
| 5 | Magazzino e concorrenza | |
| 6 | Pannello admin | |
| 7 | Email, spedizioni, IVA | |
| 8 | SEO, prestazioni, deploy | |

## Concetti chiave della Lezione 1

- **Prodotto vs Variante:** si compra una variante (es. "Blu / M"), che ha SKU, prezzo e scorte proprie.
- **Prezzi in centesimi (Int):** mai float per i soldi.
- **Slug negli URL** per leggibilità e SEO.
- **`active` invece di cancellare:** i vecchi ordini devono continuare a funzionare.
- **Server Components:** la pagina legge il database direttamente sul server.

## Concetti chiave della Lezione 2

- **Carrello nel database, id nel cookie:** il cookie `cart_id` è `httpOnly`, `sameSite=lax` e contiene un id casuale (cuid), impossibile da indovinare.
- **Non fidarti mai del browser:** dal form arrivano solo variante e quantità; prezzo, stock e proprietario del carrello li verifica il server.
- **Ogni query filtra per `cartId`:** altrimenti chiunque potrebbe modificare righe di carrelli altrui.
- **Il carrello non salva i prezzi:** mostra sempre quelli attuali. L'ordine li "congelerà" (Lezione 3).
- **Il carrello non riserva lo stock:** la verifica definitiva avviene al checkout (Lezione 5).
- **Server Actions + `<form>`:** funziona anche senza JavaScript (progressive enhancement).

## Concetti chiave della Lezione 3

- **Snapshot:** l'ordine COPIA nomi, SKU e prezzi. È un documento storico, non deve cambiare se cambi il catalogo.
- **Transazione:** scalare il magazzino, creare l'ordine e svuotare il carrello avvengono "tutto o niente".
- **Update condizionale:** `UPDATE ... SET stock = stock - N WHERE stock >= N` impedisce di vendere pezzi che non esistono.
- **Totali calcolati solo sul server** (`lib/pricing.ts`, un'unica fonte di verità). Il totale "visto" dal cliente serve solo a rilevare cambi di prezzo.
- **Validazione con Zod** e messaggi d'errore per campo; i dati vengono anche normalizzati (es. provincia in maiuscolo).
- **IVA scorporata** dal prezzo (×22/122) e salvata nell'ordine.
- **Codice del Consumo:** pulsante «Ordine con obbligo di pagare» e accettazione delle condizioni registrata con data.
