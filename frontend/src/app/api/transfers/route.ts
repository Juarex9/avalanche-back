import { desc, eq, or } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { isAddress, isHash } from "viem";

import { getDb, isDatabaseConfigured, schema } from "@/db";
import { getEercContractAddress } from "@/lib/contracts";

export const dynamic = "force-dynamic";

function normalizeAddr(addr: string): string {
  return addr.toLowerCase();
}

export async function GET(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return Response.json({ transfers: [], db: false });
  }

  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const address = searchParams.get("address")?.trim();

  const db = getDb();

  const transfers =
    address && isAddress(address)
      ? await db
          .select()
          .from(schema.indexedTransfers)
          .where(
            or(
              eq(schema.indexedTransfers.fromAddress, normalizeAddr(address)),
              eq(schema.indexedTransfers.toAddress, normalizeAddr(address)),
            ),
          )
          .orderBy(desc(schema.indexedTransfers.indexedAt))
          .limit(limit)
      : await db
          .select()
          .from(schema.indexedTransfers)
          .orderBy(desc(schema.indexedTransfers.indexedAt))
          .limit(limit);

  return Response.json({ transfers, db: true });
}

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }

  const body = (await req.json()) as {
    txHash?: string;
    fromAddress?: string;
    toAddress?: string | null;
    transferType?: "register" | "transfer" | "mint" | "burn" | "other";
    reference?: string;
    contractAddress?: string;
  };

  const txHash = body.txHash?.trim();
  if (!txHash || !isHash(txHash)) {
    return Response.json({ error: "txHash inválido" }, { status: 400 });
  }
  const from = body.fromAddress?.trim();
  if (!from || !isAddress(from)) {
    return Response.json({ error: "fromAddress inválida" }, { status: 400 });
  }

  let to: string | null = null;
  if (body.toAddress?.trim()) {
    if (!isAddress(body.toAddress)) {
      return Response.json({ error: "toAddress inválida" }, { status: 400 });
    }
    to = normalizeAddr(body.toAddress);
  }

  const db = getDb();
  const contract =
    body.contractAddress?.trim() || getEercContractAddress();

  try {
    const [row] = await db
      .insert(schema.indexedTransfers)
      .values({
        txHash: txHash.toLowerCase(),
        fromAddress: normalizeAddr(from),
        toAddress: to,
        transferType: body.transferType ?? "transfer",
        reference: body.reference?.trim() || null,
        contractAddress: contract.toLowerCase(),
      })
      .onConflictDoNothing({ target: schema.indexedTransfers.txHash })
      .returning();

    return Response.json({ transfer: row ?? null, indexed: Boolean(row) });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Error al indexar" },
      { status: 500 },
    );
  }
}
