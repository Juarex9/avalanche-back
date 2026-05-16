import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { ethers, zkit } from "hardhat";
import type { RegistrationCircuit } from "../generated-types/zkit";
import { User } from "../test/user";

/**
 * Registra una wallet en Fuji usando clave EOA (misma lógica que tests).
 * Guarda claves BabyJub para importar en el browser (sessionStorage).
 *
 * Env: WALLET_PRIVATE_KEY (o PRIVATE_KEY)
 *      DEPLOYMENT_FILE (opcional)
 */
async function main() {
  const pk =
    process.env.WALLET_PRIVATE_KEY?.trim() ??
    process.env.PRIVATE_KEY?.trim();
  if (!pk) {
    throw new Error("Set WALLET_PRIVATE_KEY or PRIVATE_KEY");
  }

  const file =
    process.env.DEPLOYMENT_FILE ??
    resolve(__dirname, "../../EncryptedERC/deployments/fuji-standalone.json");
  const { registrar: registrarAddr } = JSON.parse(readFileSync(file, "utf8")) as {
    registrar: string;
  };

  const wallet = new ethers.Wallet(
    pk.startsWith("0x") ? pk : `0x${pk}`,
    ethers.provider,
  );
  const registrar = await ethers.getContractAt("Registrar", registrarAddr, wallet);

  const user = new User(wallet as never);
  const chainId = (await ethers.provider.getNetwork()).chainId;

  if (await registrar.isUserRegistered(wallet.address)) {
    console.log("Already registered:", wallet.address);
    return;
  }

  const circuit = await zkit.getCircuit("RegistrationCircuit");
  const registrationCircuit = circuit as unknown as RegistrationCircuit;

  const registrationHash = user.genRegistrationHash(chainId);
  const input = {
    SenderPrivateKey: user.formattedPrivateKey,
    SenderPublicKey: user.publicKey,
    SenderAddress: BigInt(wallet.address),
    ChainID: chainId,
    RegistrationHash: registrationHash,
  };

  console.log("Generating registration proof for", wallet.address, "...");
  const proof = await registrationCircuit.generateProof(input);
  const calldata = await registrationCircuit.generateCalldata(proof);

  const tx = await registrar.register({
    proofPoints: calldata.proofPoints,
    publicSignals: calldata.publicSignals,
  });
  await tx.wait();

  const outDir = resolve(__dirname, "../../EncryptedERC/deployments/demo-keys");
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, `${wallet.address.toLowerCase()}.json`);
  const payload = {
    address: wallet.address,
    formattedPrivateKey: user.formattedPrivateKey.toString(),
    publicKey: user.publicKey.map((x) => x.toString()),
    registrationTx: tx.hash,
    sessionStorageHint:
      "Tras conectar esta wallet en Cello, pegá en consola del navegador (si el SDK no descifra): " +
      `sessionStorage.setItem('cello-eerc-decryption-key', '${user.formattedPrivateKey}');`,
  };
  writeFileSync(outFile, JSON.stringify(payload, null, 2));

  console.log("Registered:", wallet.address);
  console.log("Tx:", tx.hash);
  console.log("Keys saved:", outFile);
  console.log("\n", payload.sessionStorageHint, "\n");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
