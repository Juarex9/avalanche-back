import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ethers } from "hardhat";

const DEMO_BANK =
  process.env.BANK_DEMO_BENEFICIARY ?? "0x79d23BB592FD230e441874d0e889C58f8FD92E07";
const DEMO_FIN = process.env.FIN_NOVA_SAFE ?? "0xC8af2C4e87C942F82BaBC4da98364C2c1A82DF32";
const DEMO_AUDITOR = process.env.AUDITOR_ADDRESS ?? DEMO_FIN;

async function main() {
  const file =
    process.env.DEPLOYMENT_FILE ??
    resolve(__dirname, "../../EncryptedERC/deployments/fuji-standalone.json");
  const { encryptedERC: eercAddr, registrar: registrarAddr } = JSON.parse(
    readFileSync(file, "utf8"),
  ) as { encryptedERC: string; registrar: string };

  const eerc = await ethers.getContractAt("EncryptedERC", eercAddr);
  const registrar = await ethers.getContractAt("Registrar", registrarAddr);
  const [deployer] = await ethers.getSigners();

  const addresses = [
    { label: "Deployer", address: deployer.address },
    { label: "Bankaool (BANK)", address: DEMO_BANK },
    { label: "FinNova (FIN)", address: DEMO_FIN },
    { label: "Auditor (target)", address: DEMO_AUDITOR },
  ];

  console.log("\n=== Cello eERC — Fuji demo status ===\n");
  console.log("Contract:", eercAddr);
  console.log("Registrar:", registrarAddr);
  console.log("Deployer:", deployer.address);
  console.log("isAuditorKeySet:", await eerc.isAuditorKeySet());
  if (await eerc.isAuditorKeySet()) {
    console.log("auditor address:", await eerc.auditor());
  }
  console.log("");

  for (const { label, address } of addresses) {
    const reg = await registrar.isUserRegistered(address);
    console.log(`${label}: ${address}`);
    console.log(`  registered: ${reg}`);
    if (reg) {
      const pk = await registrar.getUserPublicKey(address);
      console.log(`  publicKey: [${pk[0]}, ${pk[1]}]`);
    }
  }

  console.log("\n--- Próximos pasos ---");
  const auditorOk = await eerc.isAuditorKeySet();
  const bankOk = await registrar.isUserRegistered(DEMO_BANK);
  const finOk = await registrar.isUserRegistered(DEMO_FIN);
  const auditorReg = await registrar.isUserRegistered(DEMO_AUDITOR);

  if (!auditorReg) {
    console.log("1) Conectar wallet auditor en Cello /registro y completar registro ZK");
  }
  if (!auditorOk && auditorReg) {
    console.log("2) npx hardhat run scripts/set-auditor-fuji.ts --network fuji");
  } else if (!auditorOk) {
    console.log("2) Tras registro auditor: AUDITOR_ADDRESS=... npx hardhat run scripts/set-auditor-fuji.ts --network fuji");
  }
  if (!bankOk || !finOk) {
    console.log("3) Registrar Bankaool y FinNova en /registro (cada wallet, ~1–2 min ZK)");
  }
  if (bankOk && (await eerc.isAuditorKeySet())) {
    console.log("4) Mint demo: RECIPIENT=" + DEMO_BANK + " npx hardhat run scripts/mint-demo-fuji.ts --network fuji");
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
