# Scripts eERC — Fuji (Cello)

Ejecutar **desde** `avalanche-back/EncryptedERC` (submódulo con Hardhat + zkit):

```bash
cd avalanche-back/EncryptedERC
npm install
npx hardhat zkit make --force
npx hardhat compile

# Copiar .env del monorepo (PRIVATE_KEY, RPC_URL)
cp ../.env .env

npx hardhat run ../scripts/eerc-fuji/demo-status-fuji.ts --network fuji
npx hardhat run ../scripts/eerc-fuji/set-auditor-fuji.ts --network fuji
RECIPIENT_ADDRESS=0x... MINT_AMOUNT=5000 npx hardhat run ../scripts/eerc-fuji/mint-demo-fuji.ts --network fuji
```

Deploy inicial (solo una vez): `deploy-fuji-standalone.ts` → `EncryptedERC/deployments/fuji-standalone.json`

Contrato actual en producción: `0x45C1316953c92C402AB9e14EA628182A3494FD7F`
