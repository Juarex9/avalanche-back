"use client";

import { useCallback, useEffect, useState } from "react";

import { TxLink } from "@/components/tx-link";
import { shortAddress } from "@/lib/format-address";

type TransferRow = {
  id: string;
  txHash: string;
  fromAddress: string;
  toAddress: string | null;
  transferType: string;
  reference: string | null;
  indexedAt: string;
};

type TransferHistoryProps = {
  address?: string;
  refreshKey?: number;
};

export function TransferHistory({ address, refreshKey = 0 }: TransferHistoryProps) {
  const [rows, setRows] = useState<TransferRow[]>([]);
  const [db, setDb] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (address) params.set("address", address);
      const res = await fetch(`/api/transfers?${params}`);
      const data = (await res.json()) as {
        transfers: TransferRow[];
        db: boolean;
      };
      setRows(data.transfers ?? []);
      setDb(Boolean(data.db));
    } catch {
      setRows([]);
      setDb(false);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, refreshKey]);

  if (loading) {
    return <p className="text-[12px] text-[var(--text3)]">Cargando historial…</p>;
  }

  if (!db) {
    return (
      <p className="text-[12px] text-[var(--text3)]">
        Base de datos no configurada. Definí{" "}
        <code className="font-mono">DATABASE_URL</code> en el servidor.
      </p>
    );
  }

  if (!rows.length) {
    return (
      <p className="text-[12px] text-[var(--text3)]">
        Sin transacciones indexadas todavía.
      </p>
    );
  }

  return (
    <div className="tx-table" role="region" aria-label="Historial indexado">
      <div className="tx-head">
        <div>TIPO</div>
        <div>CONTRAPARTE</div>
        <div>REF</div>
        <div>TX</div>
      </div>
      {rows.map((row) => {
        const isOut =
          Boolean(address) &&
          row.fromAddress.toLowerCase() === address!.toLowerCase();
        const counterparty = isOut ? row.toAddress : row.fromAddress;
        return (
          <div key={row.id} className="tx-row tx-row--static">
            <div>
              <span className="zk-tag">{row.transferType}</span>
            </div>
            <div className="tx-to">
              {counterparty ? shortAddress(counterparty) : "—"}
            </div>
            <div className="tx-hash-sm">{row.reference ?? "—"}</div>
            <div>
              <TxLink hash={row.txHash} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
