import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@solarity/chai-zkit";
import "@solarity/hardhat-zkit";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";

import dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.RPC_URL || "https://api.avax.network/ext/bc/C/rpc";

const deployerKeyRaw =
  process.env.DEPLOYER_PRIVATE_KEY?.trim() ?? process.env.PRIVATE_KEY?.trim();
function normalizeHexPrivateKey(raw: string | undefined): string[] {
  if (!raw) return [];
  const t = raw.trim();
  if (t.startsWith("0x") && /^0x[0-9a-fA-F]{64}$/.test(t)) return [t];
  if (/^[0-9a-fA-F]{64}$/.test(t)) return [`0x${t}`];
  return [];
}
const fujiAccounts = normalizeHexPrivateKey(deployerKeyRaw);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: RPC_URL,
        blockNumber: 59121339,
        enabled: !!process.env.FORKING,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    /** Avalanche Fuji (C-Chain) — mismo chainId que el frontend (`wagmi` / `avalancheFuji`). */
    avalancheFuji: {
      url:
        process.env.AVALANCHE_FUJI_RPC_URL ??
        "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: fujiAccounts,
    },
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    excludeContracts: ["contracts/mocks/"],
    outputFile: "gas-report.txt",
    L1: "avalanche",
    showMethodSig: true,
  },
  zkit: {
    compilerVersion: "2.1.9",
    circuitsDir: "circom",
    compilationSettings: {
      artifactsDir: "zkit/artifacts",
      onlyFiles: [],
      skipFiles: [],
      c: false,
      json: false,
      optimization: "O2",
    },
    setupSettings: {
      contributionSettings: {
        provingSystem: "groth16",
        contributions: 0,
      },
      onlyFiles: [],
      skipFiles: [],
      ptauDir: undefined,
      ptauDownload: true,
    },
    verifiersSettings: {
      verifiersDir: "contracts/verifiers",
      verifiersType: "sol",
    },
    typesDir: "generated-types/zkit",
    quiet: false,
  },
};

export default config;
