import type { CelloPublicEnv } from "@/lib/env";

/** Contratos de referencia en Fuji (3dent / Ava Labs demo). Override con env en prod. */
export const FUJI_EERC_STANDALONE =
  "0x5E9c6F952fB9615583182e70eDDC4e6E4E0aC0e0" as const;

export const FUJI_EERC_CONVERTER =
  "0x372dAB27c8d223Af11C858ea00037Dc03053B22E" as const;

export const FUJI_DEMO_ERC20 =
  "0xb0Fe621B4Bd7fe4975f7c58E3D6ADaEb2a2A35CD" as const;

export const EXPLORER_ADDRESS = "https://testnet.snowtrace.io/address/";
export const EXPLORER_TX = "https://testnet.snowtrace.io/tx/";

export const CIRCUIT_CONFIG = {
  register: {
    wasm: "/circuits/RegistrationCircuit.wasm",
    zkey: "/circuits/RegistrationCircuit.groth16.zkey",
  },
  mint: {
    wasm: "/circuits/MintCircuit.wasm",
    zkey: "/circuits/MintCircuit.groth16.zkey",
  },
  transfer: {
    wasm: "/circuits/TransferCircuit.wasm",
    zkey: "/circuits/TransferCircuit.groth16.zkey",
  },
  withdraw: {
    wasm: "/circuits/WithdrawCircuit.wasm",
    zkey: "/circuits/WithdrawCircuit.groth16.zkey",
  },
  burn: {
    wasm: "/circuits/MintCircuit.wasm",
    zkey: "/circuits/MintCircuit.groth16.zkey",
  },
} as const;

/** URLs de circuits que recibe `useEERC` (rutas absolutas https en el browser). */
export type CircuitUrlsConfig = {
  [K in keyof typeof CIRCUIT_CONFIG]: {
    wasm: string;
    zkey: string;
  };
};

/**
 * El SDK (@avalabs/eerc-sdk) resuelve rutas que empiezan con `/` usando
 * `new URL(path, import.meta.url)`, que en el bundle de Next apunta al chunk
 * bajo `/_next/...` y rompe el fetch de `.wasm` / `.zkey` (Failed to fetch).
 * Siempre pasar URLs absolutas con el origen de la app.
 */
export function circuitUrlsWithAppOrigin(
  appOrigin: string,
): CircuitUrlsConfig {
  const base = appOrigin.replace(/\/$/, "");
  const abs = (path: string) =>
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  return {
    register: {
      wasm: abs(CIRCUIT_CONFIG.register.wasm),
      zkey: abs(CIRCUIT_CONFIG.register.zkey),
    },
    mint: {
      wasm: abs(CIRCUIT_CONFIG.mint.wasm),
      zkey: abs(CIRCUIT_CONFIG.mint.zkey),
    },
    transfer: {
      wasm: abs(CIRCUIT_CONFIG.transfer.wasm),
      zkey: abs(CIRCUIT_CONFIG.transfer.zkey),
    },
    withdraw: {
      wasm: abs(CIRCUIT_CONFIG.withdraw.wasm),
      zkey: abs(CIRCUIT_CONFIG.withdraw.zkey),
    },
    burn: {
      wasm: abs(CIRCUIT_CONFIG.burn.wasm),
      zkey: abs(CIRCUIT_CONFIG.burn.zkey),
    },
  };
}

export function resolveEercContract(env: CelloPublicEnv): `0x${string}` {
  if (env.eercContract) return env.eercContract;
  return env.eercMode === "converter"
    ? FUJI_EERC_CONVERTER
    : FUJI_EERC_STANDALONE;
}

export function resolveConverterToken(env: CelloPublicEnv): `0x${string}` | undefined {
  if (env.eercMode !== "converter") return undefined;
  return env.converterErc20 ?? FUJI_DEMO_ERC20;
}

export function explorerTx(hash: string): string {
  return `${EXPLORER_TX}${hash}`;
}
