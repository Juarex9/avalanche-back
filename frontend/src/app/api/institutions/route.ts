import { desc, eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { isAddress } from "viem";

import { getDb, isDatabaseConfigured, schema } from "@/db";

export const dynamic = "force-dynamic";

function normalizeAddr(addr: string): `0x${string}` {
  return addr.toLowerCase() as `0x${string}`;
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json({ institutions: [], db: false });
  }

  const rows = await getDb()
    .select()
    .from(schema.institutions)
    .orderBy(desc(schema.institutions.createdAt));

  return Response.json({ institutions: rows, db: true });
}

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }

  const body = (await req.json()) as {
    walletAddress?: string;
    name?: string;
    initials?: string;
    kycStatus?: "pending" | "approved" | "rejected";
  };

  const wallet = body.walletAddress?.trim();
  if (!wallet || !isAddress(wallet)) {
    return Response.json({ error: "walletAddress inválida" }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return Response.json({ error: "name requerido" }, { status: 400 });
  }

  const walletAddress = normalizeAddr(wallet);
  const db = getDb();

  const existing = await db
    .select()
    .from(schema.institutions)
    .where(eq(schema.institutions.walletAddress, walletAddress))
    .limit(1);

  if (existing[0]) {
    const [updated] = await db
      .update(schema.institutions)
      .set({
        name: body.name.trim(),
        initials: body.initials?.trim() || existing[0].initials,
        kycStatus: body.kycStatus ?? existing[0].kycStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.institutions.id, existing[0].id))
      .returning();
    return Response.json({ institution: updated });
  }

  const [created] = await db
    .insert(schema.institutions)
    .values({
      walletAddress,
      name: body.name.trim(),
      initials: body.initials?.trim() || "??",
      kycStatus: body.kycStatus ?? "pending",
    })
    .returning();

  return Response.json({ institution: created }, { status: 201 });
}
