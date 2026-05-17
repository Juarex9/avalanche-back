#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/circuits"
BASE="https://raw.githubusercontent.com/BeratOz01/3dent/main/public"

mkdir -p "$DEST"

FILES=(
  RegistrationCircuit.wasm
  RegistrationCircuit.groth16.zkey
  TransferCircuit.wasm
  TransferCircuit.groth16.zkey
  MintCircuit.wasm
  MintCircuit.groth16.zkey
  WithdrawCircuit.wasm
  WithdrawCircuit.groth16.zkey
)

echo "Descargando circuitos ZK a public/circuits/ …"
for f in "${FILES[@]}"; do
  echo "  → $f"
  curl -fsSL "$BASE/$f" -o "$DEST/$f"
done

echo "Listo. $(wc -c < "$DEST/RegistrationCircuit.wasm" | tr -d ' ') bytes (register wasm)."
