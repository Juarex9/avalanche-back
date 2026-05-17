"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { isAddress, parseUnits } from "viem";
import { useAccount } from "wagmi";

import { Feedback } from "@/components/feedback";
import { TxLink } from "@/components/tx-link";
import { TransferHistory } from "@/components/transfer-history";
import { EncBadge } from "@/components/cello/enc-badge";
import { PageHeader } from "@/components/cello/page-header";
import { PageShell } from "@/components/cello/page-shell";
import { WalletStatus } from "@/components/cello/wallet-status";
import { ZkProgress } from "@/components/zk-progress";
import {
  useEncryptedBalanceHook,
  useCelloEerc,
} from "@/contexts/eerc-context";
import { getVerifiedCounterparties } from "@/data/demo";
import { getEercContractAddress } from "@/lib/contracts";
import { loadDecryptionKey } from "@/lib/decryption-key-storage";
import { formatTransferError } from "@/lib/format-transfer-error";
import { indexTransferOnServer } from "@/lib/index-transfer";
import { shortAddress } from "@/lib/format-address";

export default function TransferenciasPage() {
  const { address, isConnected } = useAccount();
  const { sdk, hasDecryptionKey, persistDecryptionKey } = useCelloEerc();
  const balance = useEncryptedBalanceHook();
  const contract = getEercContractAddress();

  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState<`0x${string}` | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counterparties = getVerifiedCounterparties();
  const decimals = balance.decimals ? Number(balance.decimals) : 18;
  const bal = balance.parsedDecryptedBalance ?? "—";

  function pickCounterparty(addr?: `0x${string}`) {
    if (addr) {
      setDestination(addr);
      setError(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFeedback(null);

    try {
      if (!isConnected || !address) {
        setError("Conectá tu wallet en Fuji.");
        return;
      }
      if (!sdk.isRegistered) {
        setError("Completá el registro en /registro antes de transferir.");
        return;
      }
      const storedKey = loadDecryptionKey();
      if (!storedKey) {
        setError(
          "Falta la clave de descifrado. Pegá cello-eerc-decryption-key en consola (FASES-DEMO.md) y recargá, o completá /registro con esta wallet.",
        );
        return;
      }
      if (!hasDecryptionKey) {
        persistDecryptionKey(storedKey);
        setFeedback("Clave de descifrado cargada. Pulsá Transferir de nuevo.");
        return;
      }
      const trimmed = destination.trim();
      if (!isAddress(trimmed)) {
        setError("Destino inválido: dirección 0x completa.");
        return;
      }
      const { isRegistered: destOk } = await sdk.isAddressRegistered(trimmed);
      if (!destOk) {
        setError("El destinatario debe estar registrado en eERC20.");
        return;
      }
      if (!amount.trim()) {
        setError("Indicá un monto.");
        return;
      }

      setFeedback("Generando prueba ZK (1–2 min). No cierres la pestaña…");
      const parsed = parseUnits(amount.trim(), decimals);
      const { transactionHash } = await balance.privateTransfer(
        trimmed,
        parsed,
        reference.trim() || undefined,
      );
      balance.refetchBalance();
      setLastTx(transactionHash as `0x${string}`);
      setFeedback("Transferencia enviada correctamente.");
      setHistoryKey((k) => k + 1);
      void indexTransferOnServer({
        txHash: transactionHash,
        fromAddress: address,
        toAddress: trimmed,
        transferType: "transfer",
        reference: reference.trim() || undefined,
        contractAddress: contract,
      });
      setAmount("");
    } catch (err) {
      setError(formatTransferError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell width="full">
      <div className="app-layout">
        <aside aria-label="Resumen">
          <div className="bal-block">
                        <div className="bal-label">Saldo descifrado</div>
            <div className="bal-val">{bal}</div>
            <div className="bal-currency">
              {sdk.symbol || "eERC"} · {shortAddress(contract)}
            </div>
          </div>
          <WalletStatus />
        </aside>

        <div className="main">
          <PageHeader
            kicker="Transferencias"
            title="Nueva transferencia"
            description="Montos privados on-chain con copia auditada para el regulador."
            badge={<EncBadge />}
          />

          <Feedback message={error} variant="error" />
          {sdk.isRegistered && !hasDecryptionKey ? (
            <Feedback
              message="Falta la clave de descifrado. En /registro usá «Cargar clave desde el deploy» con el código de equipo."
              variant="info"
            />
          ) : null}
          <Feedback
            message={feedback}
            variant={
              feedback?.toLowerCase().includes("correctamente")
                ? "success"
                : busy
                  ? "loading"
                  : "info"
            }
          />
          {lastTx ? (
            <p className="tx-feedback">
              Transacción: <TxLink hash={lastTx} />
            </p>
          ) : null}
          {busy ? <ZkProgress /> : null}

          <form className="form-card" onSubmit={onSubmit}>
            <div className="form-card-head">
              <div className="form-card-title">Datos</div>
              <div className="form-card-meta">ZK · dual-lock</div>
            </div>
            <div className="fields">
              <div className="fl">
                <label className="fl-label" htmlFor="dest-address">
                  Destino (0x…)
                </label>
                <input
                  id="dest-address"
                  className="fl-input"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="0x…"
                  autoComplete="off"
                />
              </div>
              <div className="fl">
                <span className="fl-label" id="amount-label">
                  Monto
                </span>
                <div className="amt-row" role="group" aria-labelledby="amount-label">
                  <input
                    className="fl-input lg"
                    style={{ flex: 1 }}
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                  />
                  <span className="currency-sel">{sdk.symbol || "TOKEN"}</span>
                </div>
              </div>
              <div className="fl">
                <label className="fl-label" htmlFor="tx-ref">
                  Referencia
                </label>
                <input
                  id="tx-ref"
                  className="fl-input"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="form-footer">
              <button
                type="submit"
                className="submit-btn"
                disabled={busy || !sdk.isRegistered}
              >
                {busy ? "Enviando…" : "Transferir"}
              </button>
            </div>
          </form>

          <h3 className="section-label">Historial</h3>
          <TransferHistory address={address} refreshKey={historyKey} />
        </div>

        <aside className="right" aria-label="Contrapartes">
          <div className="panel">
            <p className="panel-label">Contrapartes</p>
            <div className="cp-list">
              {counterparties.map((cp) => (
                <button
                  key={cp.addrShort}
                  type="button"
                  className="cp"
                  disabled={!cp.address}
                  onClick={() => pickCounterparty(cp.address)}
                >
                  <span className="cp-av">{cp.initials}</span>
                  <span className="cp-body">
                    <span className="cp-name">{cp.name}</span>
                    <span className="cp-addr">
                      {cp.address ? shortAddress(cp.address) : "sin .env"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="panel-text mt-3">
            <Link href="/recibir" className="text-[var(--text2)] underline-offset-2 hover:underline">
              Recibir pagos →
            </Link>
          </p>
        </aside>
      </div>
    </PageShell>
  );
}
