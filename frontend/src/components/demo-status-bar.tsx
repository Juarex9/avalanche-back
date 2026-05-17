"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { avalancheFuji } from "wagmi/chains";

import { useCelloEerc } from "@/contexts/eerc-context";
import { useCircuitsReady } from "@/hooks/use-circuits-ready";
import { getEercContractAddress, isEercConfigured } from "@/lib/contracts";
import { shortAddress } from "@/lib/format-address";

type Check = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export function DemoStatusBar() {
  const { isConnected, chainId, address } = useAccount();
  const { sdk } = useCelloEerc();
  const circuitsOk = useCircuitsReady();
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    fetch("/api/db/health")
      .then((r) => r.json())
      .then((d: { ok?: boolean }) => setDbOk(Boolean(d.ok)))
      .catch(() => setDbOk(false));
  }, []);

  const contract = getEercContractAddress();
  const customContract = isEercConfigured();

  const checks: Check[] = [
    {
      id: "wallet",
      label: "Wallet",
      ok: isConnected && Boolean(address),
      detail: address ? shortAddress(address) : "desconectada",
    },
    {
      id: "fuji",
      label: "Fuji",
      ok: isConnected && chainId === avalancheFuji.id,
      detail:
        chainId === avalancheFuji.id
          ? "43113"
          : chainId
            ? `red ${chainId}`
            : "—",
    },
    {
      id: "circuits",
      label: "Circuitos ZK",
      ok: circuitsOk === true,
      detail: circuitsOk === null ? "…" : circuitsOk ? "ok" : "falta fetch",
    },
    {
      id: "contract",
      label: "Contrato",
      ok: Boolean(contract),
      detail: customContract
        ? shortAddress(contract)
        : `${shortAddress(contract)} (demo)`,
    },
    {
      id: "sdk",
      label: "SDK",
      ok: sdk.isInitialized && sdk.isAllDataFetched,
      detail: sdk.isInitialized ? "listo" : "cargando",
    },
    {
      id: "register",
      label: "Registro",
      ok: sdk.isRegistered,
      detail: sdk.isRegistered ? "activo" : "pendiente",
    },
    {
      id: "auditor",
      label: "Auditor key",
      ok: sdk.isAuditorKeySet,
      detail: sdk.isAuditorKeySet ? "on-chain" : "deploy back",
    },
    {
      id: "db",
      label: "Neon DB",
      ok: dbOk === true,
      detail: dbOk === null ? "…" : dbOk ? "conectada" : "sin DATABASE_URL",
    },
  ];

  const allOk = checks.every((c) => c.ok);
  const readyCount = checks.filter((c) => c.ok).length;

  return (
    <div className="demo-status-bar" role="region" aria-label="Estado de la demo">
      <div className="demo-status-inner">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span
            className={`demo-status-pill ${allOk ? "ok" : "warn"}`}
            title={allOk ? "Listo para demo en vivo" : `${readyCount}/${checks.length} checks`}
          >
            {allOk ? "Demo lista" : `Preparación ${readyCount}/${checks.length}`}
          </span>
          {!collapsed
            ? checks.map((c) => (
                <span
                  key={c.id}
                  className={`demo-status-chip ${c.ok ? "ok" : "pending"}`}
                  title={c.detail}
                >
                  <span className="demo-status-dot" aria-hidden />
                  {c.label}
                </span>
              ))
            : null}
        </div>
        <button
          type="button"
          className="demo-status-toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
        >
          {collapsed ? "Mostrar checks" : "Ocultar"}
        </button>
      </div>
    </div>
  );
}
