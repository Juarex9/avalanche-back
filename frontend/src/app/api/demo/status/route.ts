import { isDemoUnlockConfigured, getDemoWalletAddresses } from "@/lib/demo-server";
import { resolveEercContract } from "@/lib/eerc-config";
import { getPublicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getPublicEnv();
  return Response.json({
    productionUrl: "https://cello-avax.vercel.app",
    contract: resolveEercContract(env),
    demoUnlockConfigured: isDemoUnlockConfigured(),
    demoWallets: getDemoWalletAddresses(),
  });
}
