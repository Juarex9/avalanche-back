import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ethers } from "hardhat";
import { privateMint } from "../../EncryptedERC/test/helpers";

/**
 * Owner mints private CELL to a registered recipient.
 * Requires: isAuditorKeySet + recipient registered (via /registro).
 *
 * Env: RECIPIENT_ADDRESS (default BANK_DEMO_BENEFICIARY)
 *      MINT_AMOUNT (default 1000 — token units, 18 decimals)
 */
async function main() {
  const recipient =
    process.env.RECIPIENT_ADDRESS?.trim() ??
    process.env.BANK_DEMO_BENEFICIARY?.trim() ??
    "0xBD1e2b220C41bcB724e61459CA401c552028106E";

  const amountHuman = process.env.MINT_AMOUNT ?? "1000";
  const amount = ethers.parseUnits(amountHuman, 18);

  const file =
    process.env.DEPLOYMENT_FILE ??
    resolve(__dirname, "../../EncryptedERC/deployments/fuji-standalone.json");
  const { encryptedERC: eercAddr, registrar: registrarAddr } = JSON.parse(
    readFileSync(file, "utf8"),
  ) as { encryptedERC: string; registrar: string };

  const [owner] = await ethers.getSigners();
  const eerc = await ethers.getContractAt("EncryptedERC", eercAddr, owner);
  const registrar = await ethers.getContractAt("Registrar", registrarAddr);

  if (!(await eerc.isAuditorKeySet())) {
    throw new Error("Auditor key not set. Run set-auditor-fuji.ts first.");
  }
  if (!(await registrar.isUserRegistered(recipient))) {
    throw new Error(
      `Recipient ${recipient} not registered. Complete /registro in Cello first.`,
    );
  }

  const receiverPk = await registrar.getUserPublicKey(recipient);
  const receiverPublicKey = [BigInt(receiverPk[0]), BigInt(receiverPk[1])];

  const auditorPk = await eerc.auditorPublicKey();
  const auditorPublicKey = [BigInt(auditorPk[0]), BigInt(auditorPk[1])];

  console.log("Minting", amountHuman, "CELL to", recipient, "...");
  const calldata = await privateMint(amount, receiverPublicKey, auditorPublicKey);

  const tx = await eerc[
    "privateMint(address,((uint256[2],uint256[2][2],uint256[2]),uint256[24]))"
  ](recipient, {
    proofPoints: calldata.proofPoints,
    publicSignals: calldata.publicSignals,
  });
  await tx.wait();

  console.log("Done. tx:", tx.hash);
  console.log("Recipient can refresh balance on /transferencias");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
