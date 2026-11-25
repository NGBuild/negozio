// Pagina prodotto: /prodotti/maglietta-cotone-bio
// [slug] tra parentesi quadre = segmento dinamico dell'URL.
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MAX_QTY_PER_ITEM } from "@/lib/cart";
import { AddToCartForm } from "./AddToCartForm";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: { variants: { orderBy: { id: "asc" } }, category: true },
  });

  if (!product || !product.active) notFound(); // → pagina 404

  // Al Client Component passiamo solo i campi necessari (non l'intero record del DB):
  // tutto ciò che passa come prop finisce nell'HTML/JS inviato al browser.
  const variants = product.variants.map(({ id, name, priceCents, stock }) => ({ id, name, priceCents, stock }));

  return (
    <div className="product">
      <img src={product.imageUrl} alt={product.name} />
      <div>
        <small>{product.category.name}</small>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <AddToCartForm variants={variants} maxQty={MAX_QTY_PER_ITEM} />
      </div>
    </div>
  );
}
