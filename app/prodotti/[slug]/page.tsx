// Pagina prodotto: /prodotti/maglietta-cotone-bio
// [slug] tra parentesi quadre = segmento dinamico dell'URL.
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: { variants: { orderBy: { id: "asc" } }, category: true },
  });

  if (!product || !product.active) notFound(); // → pagina 404

  return (
    <div className="product">
      <img src={product.imageUrl} alt={product.name} />
      <div>
        <small>{product.category.name}</small>
        <h1>{product.name}</h1>
        <p>{product.description}</p>

        <h3>Varianti</h3>
        <ul className="variants">
          {product.variants.map((v) => (
            <li key={v.id}>
              <span>{v.name}</span>
              <strong>{formatPrice(v.priceCents)}</strong>
              <span className={v.stock > 0 ? "ok" : "soldout"}>
                {v.stock === 0 ? "Esaurito" : v.stock <= 3 ? `Solo ${v.stock} rimasti!` : "Disponibile"}
              </span>
            </li>
          ))}
        </ul>
        {/* Lezione 2: pulsante "Aggiungi al carrello" */}
      </div>
    </div>
  );
}
