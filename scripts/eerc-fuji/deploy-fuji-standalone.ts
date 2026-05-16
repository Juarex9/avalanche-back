import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { ethers } from "hardhat";
import { deployLibrary, deployVerifiers } from "../../EncryptedERC/test/helpers";
import { EncryptedERC__factory } from "../../EncryptedERC/typechain-types";
import { DECIMALS } from "../../EncryptedERC/scripts/constants";

const TOKEN_NAME = process.env.EERC_TOKEN_NAME ?? "Cello";
const TOKEN_SYMBOL = process.env.EERC_TOKEN_SYMBOL ?? "CELL";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer — set PRIVATE_KEY in EncryptedERC/.env");
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance === 0n) {
    throw new Error(
      `Deployer ${deployer.address} has 0 AVAX on Fuji. Fund via https://faucet.avax.network/`,
    );
  }

  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "AVAX");
  console.log("Network:", (await ethers.provider.getNetwork()).chainId.toString());

  const {
    registrationVerifier,
    mintVerifier,
    withdrawVerifier,
    transferVerifier,
    burnVerifier,
  } = await deployVerifiers(deployer);

  const babyJubJub = await deployLibrary(deployer);

  const registrarFactory = await ethers.getContractFactory("Registrar");
  const registrar = await registrarFactory.deploy(registrationVerifier);
  await registrar.waitForDeployment();

  const encryptedERCFactory = new EncryptedERC__factory({
    "contracts/libraries/BabyJubJub.sol:BabyJubJub": babyJubJub,
  });
  const encryptedERC = await encryptedERCFactory.connect(deployer).deploy({
    registrar: registrar.target,
    isConverter: false,
    name: TOKEN_NAME,
    symbol: TOKEN_SYMBOL,
    mintVerifier,
    withdrawVerifier,
    transferVerifier,
    burnVerifier,
    decimals: DECIMALS,
  });
  await encryptedERC.waitForDeployment();

  const deployTx = encryptedERC.deploymentTransaction();
  const deployBlock = deployTx?.blockNumber ?? (await ethers.provider.getBlockNumber());

  const auditorAddress = process.env.AUDITOR_ADDRESS?.trim();
  if (auditorAddress) {
    const registered = await registrar.isUserRegistered(auditorAddress);
    if (!registered) {
      console.warn(
        `\n⚠ AUDITOR_ADDRESS ${auditorAddress} no está registrado en el contrato.`,
      );
      console.warn(
        "  1) Conectá esa wallet en Cello /registro\n" +
          "  2) Luego: npx hardhat run scripts/set-auditor-fuji.ts --network fuji\n",
      );
    } else {
      const tx = await encryptedERC.setAuditorPublicKey(auditorAddress);
      await tx.wait();
      console.log("Auditor configurado:", auditorAddress);
    }
  }

  const out = {
    chainId: 43113,
    network: "avalanche-fuji",
    deployer: deployer.address,
    deployBlock: Number(deployBlock),
    tokenName: TOKEN_NAME,
    tokenSymbol: TOKEN_SYMBOL,
    registrationVerifier,
    mintVerifier,
    withdrawVerifier,
    transferVerifier,
    burnVerifier,
    babyJubJub,
    registrar: await registrar.getAddress(),
    encryptedERC: await encryptedERC.getAddress(),
    auditorAddress: auditorAddress ?? null,
  };

  console.table(out);

  const dir = resolve(__dirname, "../../EncryptedERC/deployments");
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, "fuji-standalone.json");
  writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("\nGuardado:", file);
  console.log("\n# Pegar en frontend/.env.local y Vercel:");
  console.log(`NEXT_PUBLIC_EERC_CONTRACT_ADDRESS=${out.encryptedERC}`);
  console.log("NEXT_PUBLIC_EERC_MODE=standalone");
  console.log(`NEXT_PUBLIC_INDEXER_FROM_BLOCK=${out.deployBlock}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
