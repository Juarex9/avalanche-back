/**
 * Comprueba que la dirección configurada responde como EncryptedERC en Fuji
 * (misma red que wagmi en el front). Uso:
 *
 *   cd frontend && cp .env.example .env.local  # y definir NEXT_PUBLIC_EERC_CONTRACT_ADDRESS
 *   npm run check:eerc
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

const rpc =
  process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC ??
  "https://api.avax-test.network/ext/bc/C/rpc";
const addr = process.env.NEXT_PUBLIC_EERC_CONTRACT_ADDRESS?.trim();

if (!addr?.startsWith("0x") || addr.length !== 42) {
  console.error(
    "Definí NEXT_PUBLIC_EERC_CONTRACT_ADDRESS (0x + 40 hex) en .env.local o .env",
  );
  process.exit(1);
}

const abi = [
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "registrar",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
];

const client = createPublicClient({
  chain: avalancheFuji,
  transport: http(rpc),
});

try {
  const [name, symbol, registrar] = await Promise.all([
    client.readContract({ address: addr, abi, functionName: "name" }),
    client.readContract({ address: addr, abi, functionName: "symbol" }),
    client.readContract({ address: addr, abi, functionName: "registrar" }),
  ]);

  console.log(
    JSON.stringify(
      {
        chainId: avalancheFuji.id,
        rpc,
        contract: addr,
        name,
        symbol,
        registrar,
        ok: true,
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error("Fallo la lectura on-chain (¿red, RPC o dirección incorrecta?)", e);
  process.exit(1);
}
