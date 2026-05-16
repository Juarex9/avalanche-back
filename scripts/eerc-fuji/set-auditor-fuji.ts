import { ethers } from "hardhat";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Owner llama setAuditorPublicKey(user) — el user debe estar registrado en eERC.
 * Env: AUDITOR_ADDRESS, opcional DEPLOYMENT_FILE
 */
async function main() {
  const auditor = process.env.AUDITOR_ADDRESS?.trim();
  if (!auditor) {
    throw new Error("Set AUDITOR_ADDRESS (wallet ya registrada en /registro)");
  }

  const file =
    process.env.DEPLOYMENT_FILE ??
    resolve(__dirname, "../../EncryptedERC/deployments/fuji-standalone.json");
  const { encryptedERC: address } = JSON.parse(readFileSync(file, "utf8")) as {
    encryptedERC: string;
  };

  const [owner] = await ethers.getSigners();
  const eerc = await ethers.getContractAt("EncryptedERC", address, owner);

  const tx = await eerc.setAuditorPublicKey(auditor);
  await tx.wait();
  console.log("Auditor set on", address, "→", auditor);
  console.log("isAuditorKeySet:", await eerc.isAuditorKeySet());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
