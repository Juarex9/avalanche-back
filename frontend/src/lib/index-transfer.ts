/** Registra una tx en Neon (best-effort; no bloquea el flujo ZK). */

export type IndexTransferPayload = {
  txHash: string;
  fromAddress: string;
  toAddress?: string | null;
  transferType?: "register" | "transfer" | "mint" | "burn" | "other";
  reference?: string;
  contractAddress?: string;
};

export async function indexTransferOnServer(
  payload: IndexTransferPayload,
): Promise<void> {
  try {
    await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* indexación opcional */
  }
}
