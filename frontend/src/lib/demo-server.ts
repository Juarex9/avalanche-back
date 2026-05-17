/** Config demo en servidor (solo API routes — nunca NEXT_PUBLIC para claves). */

export type DemoRole = "bankaool" | "finnova";

const DEMO_WALLETS: Record<DemoRole, string> = {
  bankaool:
    process.env.NEXT_PUBLIC_DEMO_BANKAOOL?.toLowerCase() ??
    "0x79d23bb592fd230e441874d0e889c58f8fd92e07",
  finnova:
    process.env.NEXT_PUBLIC_DEMO_FINNOVA?.toLowerCase() ??
    "0xc8af2c4e87c942f82babc4da98364c2c1a82df32",
};

const DEMO_KEYS: Record<DemoRole, string | undefined> = {
  bankaool: process.env.DEMO_BANKAOOL_DECRYPTION_KEY,
  finnova: process.env.DEMO_FINNOVA_DECRYPTION_KEY,
};

export function getDemoPassphrase(): string | undefined {
  return process.env.DEMO_TEAM_PASSPHRASE?.trim();
}

export function isDemoUnlockConfigured(): boolean {
  return Boolean(
    getDemoPassphrase() &&
      DEMO_KEYS.bankaool &&
      DEMO_KEYS.finnova,
  );
}

export function resolveDemoRole(
  walletAddress: string,
): DemoRole | null {
  const w = walletAddress.toLowerCase();
  if (w === DEMO_WALLETS.bankaool) return "bankaool";
  if (w === DEMO_WALLETS.finnova) return "finnova";
  return null;
}

export function getDemoDecryptionKey(role: DemoRole): string | undefined {
  return DEMO_KEYS[role];
}

export function getDemoWalletAddresses() {
  return {
    bankaool: DEMO_WALLETS.bankaool as `0x${string}`,
    finnova: DEMO_WALLETS.finnova as `0x${string}`,
  };
}
