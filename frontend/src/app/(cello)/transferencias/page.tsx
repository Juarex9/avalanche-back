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
import { useInstitutions } from "@/hooks/use-institutions";
import { getEercContractAddress } from "@/lib/contracts";
import { loadDecryptionKey } from "@/lib/decryption-key-storage";
import { formatTransferError } from "@/lib/format-transfer-error";
import { indexTransferOnServer } from "@/lib/index-transfer";
import { shortAddress } from "@/lib/format-address";

function sanitizeAmount(raw: string): string {
  // Replace comma with dot, allow only one dot
  let v = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  return v;
}

export default function TransferenciasPage() {
  const { address, isConnected } = useAccount();
  const { sdk, hasDecryptionKey, persistDecryptionKey } = useCelloEerc();
  const balance = useEncryptedBalanceHook();
  const contract = getEercContractAddress();
  const { institutions, loading: loadingInst, db: dbInst } = useInstitutions();

  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState<`0x${string}` | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decimals = balance.decimals ? Number(balance.decimals) : 18;
  const bal = balance.parsedDecryptedBalance ?? "—";

  const approvedInstitutions = institutions.filter((i) => i.kycStatus === "approved");

  function pickCounterparty(addr?: string) {
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
          "Falta la clave de descifrado. Completá /registro con esta wallet o importá tu clave de respaldo."
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
        setError("Destino inválido: ingresá una dirección 0x completa.");
        return;
      }
      const { isRegistered: destOk } = await sdk.isAddressRegistered(trimmed);
      if (!destOk) {
        setError("El destinatario debe estar registrado en eERC20.");
        return;
      }
      const cleanAmount = sanitizeAmount(amount);
      if (!cleanAmount || cleanAmount === "." || parseFloat(cleanAmount) <= 0) {
        setError("Indicá un monto válido mayor a 0.");
        return;
      }

      // Validar saldo disponible
      const parsed = parseUnits(cleanAmount, decimals);
      const available = balance.decryptedBalance ?? 0n;
      if (available <= 0n) {
        setError(
          "Saldo eERC insuficiente (0). En modo standalone, el owner del contrato debe ejecutar privateMint() a tu wallet. En modo converter, depositá tokens ERC20 primero."
        );
        return;
      }
      if (parsed > available) {
        setError(
          `Monto mayor al saldo disponible. Tenés ${balance.parsedDecryptedBalance ?? "0"} ${sdk.symbol || "TOKEN"}.`
        );
        return;
      }

      setFeedback("Generando prueba ZK (1–2 min). No cierres la pestaña…");
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
      setDestination("");
      setReference("");
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
              message="Falta la clave de descifrado. En /registro exportá tu respaldo o importá una clave existente."
              variant="info"
            />
          ) : null}
          {sdk.isRegistered && hasDecryptionKey && (balance.decryptedBalance ?? 0n) <= 0n ? (
            <div className="panel mb-4" role="note">
              <p className="panel-label mb-1">Sin saldo eERC</p>
              <p className="panel-text text-sm">
                Tu wallet está registrada pero no tenés tokens eERC. Para obtener saldo:
              </p>
              <ul className="panel-text text-sm list-disc ml-4 mt-1">
                <li><strong>Standalone:</strong> El owner del contrato debe ejecutar <code>privateMint(tuAddress)</code> desde el deployer.</li>
                <li><strong>Converter:</strong> Andá a la sección de depósito y convertí tokens ERC20 a eERC.</li>
              </ul>
            </div>
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
              <div className="form-card-meta">ZK · privado</div>
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
                  placeholder="0x… o seleccioná una institución →"
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
                    onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
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
            <p className="panel-label">Instituciones registradas</p>
            {!dbInst ? (
              <p className="panel-text text-sm">
                Directorio no disponible. Ingresá la dirección manualmente o
                contactá a la contraparte.
              </p>
            ) : loadingInst ? (
              <p className="panel-text text-sm">Cargando…</p>
            ) : approvedInstitutions.length === 0 ? (
              <p className="panel-text text-sm">
                Sin instituciones aprobadas todavía. Sos la primera.
              </p>
            ) : (
              <div className="cp-list">
                {approvedInstitutions.map((cp) => (
                  <button
                    key={cp.walletAddress}
                    type="button"
                    className="cp"
                    onClick={() => pickCounterparty(cp.walletAddress)}
                  >
                    <span className="cp-av">{cp.initials}</span>
                    <span className="cp-body">
                      <span className="cp-name">{cp.name}</span>
                      <span className="cp-addr">
                        {shortAddress(cp.walletAddress)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
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
