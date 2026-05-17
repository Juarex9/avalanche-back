"use client";

import { useCircuitsReady } from "@/hooks/use-circuits-ready";
import { getEercContractAddress } from "@/lib/contracts";

export function ConfigBanner() {
  const circuitsOk = useCircuitsReady();

  if (circuitsOk !== false) return null;

  const contract = getEercContractAddress();

  return (
    <div className="config-banner" role="status">
      Faltan circuitos ZK en <code>public/circuits/</code>. Ejecutá{" "}
      <code>npm run circuits:fetch</code> en <code>frontend/</code>. Contrato:{" "}
      <code>{contract}</code>
    </div>
  );
}
