import { sql } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { ok: false, configured: false, error: "DATABASE_URL missing" },
      { status: 503 },
    );
  }

  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return Response.json({ ok: true, configured: true, provider: "neon" });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        configured: true,
        error: err instanceof Error ? err.message : "DB connection failed",
      },
      { status: 503 },
    );
  }
}
