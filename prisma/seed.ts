// Popola il database con prodotti di esempio. Si esegue con: npm run db:seed
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Ordine inverso rispetto alle relazioni, altrimenti le chiavi esterne bloccano la cancellazione
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.variant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();

  const abbigliamento = await db.category.create({
    data: { name: "Abbigliamento", slug: "abbigliamento" },
  });
  const casa = await db.category.create({ data: { name: "Casa", slug: "casa" } });

  await db.product.create({
    data: {
      name: "Maglietta in cotone bio",
      slug: "maglietta-cotone-bio",
      description: "Maglietta 100% cotone biologico, vestibilità regolare.",
      imageUrl: "/img/tshirt.svg",
      categoryId: abbigliamento.id,
      variants: {
        create: [
          { sku: "TSHIRT-BLU-S", name: "Blu / S", priceCents: 1990, stock: 10 },
          { sku: "TSHIRT-BLU-M", name: "Blu / M", priceCents: 1990, stock: 3 },
          { sku: "TSHIRT-BLU-L", name: "Blu / L", priceCents: 1990, stock: 0 },
        ],
      },
    },
  });

  await db.product.create({
    data: {
      name: "Felpa con cappuccio",
      slug: "felpa-cappuccio",
      description: "Felpa calda e morbida, perfetta per l'inverno.",
      imageUrl: "/img/hoodie.svg",
      categoryId: abbigliamento.id,
      variants: {
        create: [
          { sku: "HOODIE-GRIGIO-M", name: "Grigio / M", priceCents: 4900, stock: 5 },
          { sku: "HOODIE-GRIGIO-L", name: "Grigio / L", priceCents: 4900, stock: 2 },
        ],
      },
    },
  });

  await db.product.create({
    data: {
      name: "Tazza in ceramica",
      slug: "tazza-ceramica",
      description: "Tazza fatta a mano, 350 ml, lavabile in lavastoviglie.",
      imageUrl: "/img/mug.svg",
      categoryId: casa.id,
      variants: { create: [{ sku: "MUG-BIANCA", name: "Bianca", priceCents: 1250, stock: 20 }] },
    },
  });

  console.log("✅ Database popolato");
}

main().finally(() => db.$disconnect());
