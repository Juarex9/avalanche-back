/** URLs de Neon (solo servidor — nunca NEXT_PUBLIC). */

export function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL?.trim() || null;
}

export function getDatabaseUrlUnpooled(): string | null {
  return (
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    null
  );
}
