"use client";

import { type FormEvent, useState } from "react";
import { isAddress, parseUnits } from "viem";
import { useAccount } from "wagmi";

import { Feedback } from "@/components/feedback";
import { TxLink } from "@/components/tx-link";
import { useCelloEerc, useEncryptedBalanceHook } from "@/contexts/eerc-context";
import { shortAddress } from "@/lib/format-address";
import { formatTransferError } from "@/lib/format-transfer-error";

function sanitizeAmount(raw: string): string {
  let v = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  return v;
}

export function AdminMintPanel() {
  const { address } = useAccount();
  const { sdk } = useCelloEerc();
  const balance = useEncryptedBalanceHook();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState<`0x${string}` | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isOwner = address ? address.toLowerCase() === sdk.owner.toLowerCase() : false;
  const decimals = balance.decimals ? Number(balance.decimals) : 18;

  if (!isOwner || sdk.isConverter) return null;

  async function handleMint(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      const trimmed = recipient.trim();
      if (!isAddress(trimmed)) {
        setErr("Destino inválido: ingresá una dirección 0x completa.");
        return;
      }
      const cleanAmount = sanitizeAmount(amount);
      if (!cleanAmount || cleanAmount === "." || parseFloat(cleanAmount) <= 0) {
        setErr("Indicá un monto válido mayor a 0.");
        return;
      }

      setMsg("Generando prueba ZK de mint…");
      const parsed = parseUnits(cleanAmount, decimals);
      const result = await balance.privateMint(trimmed, parsed);
      setLastTx(result.transactionHash as `0x${string}`);
      setMsg(`Mint exitoso: ${cleanAmount} eERC a ${shortAddress(trimmed)}`);
      setAmount("");
      setRecipient("");
      balance.refetchBalance();
    } catch (e) {
      setErr(formatTransferError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel mt-4 border-l-4 border-[var(--accent)]">
      <p className="panel-label mb-1">Panel de admin — Mint eERC</p>
      <p className="panel-text text-sm mb-3">
        Solo el owner puede mintear tokens eERC en modo standalone.
      </p>

      <form onSubmit={handleMint} className="space-y-2">
        <label className="fl">
          <span className="fl-label">Destinatario (0x…)</span>
          <input
            className="fl-input"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x…"
            autoComplete="off"
          />
        </label>
        <label className="fl">
          <span className="fl-label">Monto</span>
          <div className="amt-row">
            <input
              className="fl-input lg"
              style={{ flex: 1 }}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
              placeholder="0"
            />
            <span className="currency-sel">{sdk.symbol || "eERC"}</span>
          </div>
        </label>

        <button type="submit" className="primary-btn" disabled={busy}>
          {busy ? "Minteando…" : "Mint eERC"}
        </button>
      </form>

      {lastTx ? (
        <p className="tx-feedback mt-2">
          Tx: <TxLink hash={lastTx} />
        </p>
      ) : null}
      <Feedback message={err} variant="error" />
      <Feedback message={msg} variant="success" />
    </div>
  );
}
