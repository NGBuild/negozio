import { PrismaClient } from "@prisma/client";

// In sviluppo Next.js ricarica i moduli a ogni modifica: senza questo trucco
// creeremmo una nuova connessione al database ogni volta.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
