import { EXPLORER_ADDRESS, EXPLORER_TX } from "@/lib/eerc-config";

export function explorerTxUrl(hash: string): string {
  const h = hash.startsWith("0x") ? hash : `0x${hash}`;
  return `${EXPLORER_TX}${h}`;
}

export function explorerAddressUrl(address: string): string {
  const a = address.startsWith("0x") ? address : `0x${address}`;
  return `${EXPLORER_ADDRESS}${a}`;
}
