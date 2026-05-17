/** Config demo en servidor (solo API routes — nunca NEXT_PUBLIC para claves). */

export type DemoRole = "bankaool" | "finnova";

const DEMO_WALLETS: Record<DemoRole, string | undefined> = {
  bankaool: process.env.NEXT_PUBLIC_DEMO_BANKAOOL?.toLowerCase() || undefined,
  finnova: process.env.NEXT_PUBLIC_DEMO_FINNOVA?.toLowerCase() || undefined,
};

const DEMO_KEYS: Record<DemoRole, string | undefined> = {
  bankaool: process.env.DEMO_BANKAOOL_DECRYPTION_KEY || undefined,
  finnova: process.env.DEMO_FINNOVA_DECRYPTION_KEY || undefined,
};

export function getDemoPassphrase(): string | undefined {
  return process.env.DEMO_TEAM_PASSPHRASE?.trim() || undefined;
}

/** Nombres de env que faltan para que `/api/demo/unlock-key` funcione. */
export function getDemoUnlockMissingEnv(): string[] {
  const missing: string[] = [];
  if (!getDemoPassphrase()) missing.push("DEMO_TEAM_PASSPHRASE");
  if (!DEMO_KEYS.bankaool) missing.push("DEMO_BANKAOOL_DECRYPTION_KEY");
  if (!DEMO_KEYS.finnova) missing.push("DEMO_FINNOVA_DECRYPTION_KEY");
  return missing;
}

export function isDemoUnlockConfigured(): boolean {
  return getDemoUnlockMissingEnv().length === 0;
}

export function resolveDemoRole(
  walletAddress: string,
): DemoRole | null {
  const w = walletAddress.toLowerCase();
  if (DEMO_WALLETS.bankaool && w === DEMO_WALLETS.bankaool) return "bankaool";
  if (DEMO_WALLETS.finnova && w === DEMO_WALLETS.finnova) return "finnova";
  return null;
}

export function getDemoDecryptionKey(role: DemoRole): string | undefined {
  return DEMO_KEYS[role];
}

export function getDemoWalletAddresses() {
  return {
    bankaool: DEMO_WALLETS.bankaool as `0x${string}` | undefined,
    finnova: DEMO_WALLETS.finnova as `0x${string}` | undefined,
  };
}
