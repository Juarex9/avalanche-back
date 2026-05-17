"use client";

import { useAccount } from "wagmi";
import { avalancheFuji } from "wagmi/chains";

import { useCelloEerc } from "@/contexts/eerc-context";
import { shortAddress } from "@/lib/format-address";

export function WalletStatus() {
  const { address, isConnected, chainId } = useAccount();
  const { sdk, hasDecryptionKey } = useCelloEerc();

  const rows = [
    {
      key: "Wallet",
      value: isConnected ? "conectada" : "desconectada",
      ok: isConnected,
    },
    {
      key: "Cuenta",
      value: address ? shortAddress(address) : "—",
      ok: Boolean(address),
    },
    {
      key: "Red",
      value: chainId === avalancheFuji.id ? "Fuji" : "incorrecta",
      ok: chainId === avalancheFuji.id,
    },
    {
      key: "eERC",
      value: sdk.isRegistered ? "registrado" : "pendiente",
      ok: sdk.isRegistered,
    },
    {
      key: "Clave ZK",
      value: hasDecryptionKey ? "en sesión" : "falta",
      ok: hasDecryptionKey,
    },
  ];

  return (
    <div className="panel">
      <p className="panel-label">Estado</p>
      <ul className="stat-list">
        {rows.map((row) => (
          <li key={row.key} className="stat-row">
            <span className="stat-key">{row.key}</span>
            <span className={`stat-val ${row.ok ? "ok" : "warn"}`}>{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
