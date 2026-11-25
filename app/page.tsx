// Home page = catalogo.
// È un Server Component: gira sul server, legge il DB direttamente
// e manda al browser solo l'HTML. Ottimo per la SEO.
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";

export const dynamic = "force-dynamic"; // leggi sempre dati freschi (prezzi e scorte cambiano)

export default async function HomePage() {
  const products = await db.product.findMany({
    where: { active: true },
    include: { variants: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <h1>Catalogo</h1>
      <div className="grid">
        {products.map((p) => {
          // Mostriamo il prezzo più basso tra le varianti ("da 19,90 €")
          const minPrice = Math.min(...p.variants.map((v) => v.priceCents));
          const inStock = p.variants.some((v) => v.stock > 0);
          return (
            <Link key={p.id} href={`/prodotti/${p.slug}`} className="card">
              <img src={p.imageUrl} alt={p.name} />
              <small>{p.category.name}</small>
              <h2>{p.name}</h2>
              <p className="price">da {formatPrice(minPrice)}</p>
              {!inStock && <p className="soldout">Esaurito</p>}
            </Link>
          );
        })}
      </div>
    </>
  );
}
