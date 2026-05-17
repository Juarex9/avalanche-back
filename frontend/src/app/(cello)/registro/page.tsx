"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";

import { Feedback } from "@/components/feedback";
import { TxLink } from "@/components/tx-link";
import { PageHeader } from "@/components/cello/page-header";
import { ImportDemoKey } from "@/components/cello/import-demo-key";
import { KeyBackupPanel } from "@/components/cello/key-backup-panel";
import { PageShell } from "@/components/cello/page-shell";
import { ZkProgress } from "@/components/zk-progress";
import { useCelloEerc } from "@/contexts/eerc-context";
import { shortAddress } from "@/lib/format-address";
import { formatTransferError } from "@/lib/format-transfer-error";
import { indexTransferOnServer } from "@/lib/index-transfer";

export default function RegistroPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { sdk, persistDecryptionKey, contractAddress, hasDecryptionKey } =
    useCelloEerc();

  const [kycAccepted, setKycAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState<`0x${string}` | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const walletDone = isConnected;
  const kycDone = kycAccepted;
  const registered = sdk.isRegistered;
  const sdkReady =
    Boolean(sdk) && sdk.isInitialized && sdk.isAllDataFetched;

  async function handleRegister() {
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      if (!walletDone) {
        setError("Conectá tu wallet en Avalanche Fuji.");
        return;
      }
      if (!kycDone) {
        setError("Confirmá el checklist institucional (demo KYC).");
        return;
      }
      if (!sdkReady) {
        setFeedback("Inicializando SDK eERC20…");
        return;
      }
      setFeedback("Generando prueba ZK y registro on-chain…");
      const { key, transactionHash } = await sdk.register();
      persistDecryptionKey(key);
      setLastTx(transactionHash as `0x${string}`);
      setFeedback(`Registro exitoso · ${shortAddress(contractAddress)}`);
      if (address) {
        void indexTransferOnServer({
          txHash: transactionHash,
          fromAddress: address,
          transferType: "register",
          contractAddress,
        });
        void fetch("/api/institutions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            name: "Institución demo",
            initials: "IN",
            kycStatus: "approved",
          }),
        }).catch(() => {
          /* Neon opcional; no debe afectar el registro on-chain */
        });
      }
    } catch (e) {
      setError(formatTransferError(e));
    } finally {
      setBusy(false);
    }
  }

  const step3Class = registered
    ? "done"
    : walletDone && kycDone
      ? "current"
      : "";

  return (
    <PageShell width="narrow">
      <PageHeader
        kicker="Registro"
        title="Onboarding institucional"
        description="Wallet, KYC demo y registro eERC20 con prueba ZK en Fuji."
      />

      <Feedback message={error} variant="error" />
      <Feedback
        message={feedback}
        variant={
          feedback?.toLowerCase().includes("exitoso")
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

      <ol className="steps" aria-label="Pasos de onboarding">
        <li className={`step ${walletDone ? "done" : "current"}`}>
          <span className="step-num">{walletDone ? "✓" : "1"}</span>
          <div className="step-body">
            <div className="step-name">Wallet conectada</div>
            <div className="step-meta">MetaMask · Fuji</div>
          </div>
          <span
            className={`step-badge ${walletDone ? "badge-done" : "badge-current"}`}
          >
            {walletDone ? "listo" : "pendiente"}
          </span>
        </li>
        <li className={`step ${kycDone ? "done" : walletDone ? "current" : ""}`}>
          <span className="step-num">{kycDone ? "✓" : "2"}</span>
          <div className="step-body">
            <div className="step-name">KYC institucional</div>
            <div className="step-meta">Checklist demo</div>
          </div>
          <span
            className={`step-badge ${kycDone ? "badge-done" : walletDone ? "badge-current" : "badge-pending"}`}
          >
            {kycDone ? "listo" : "pendiente"}
          </span>
        </li>
        <li className={`step ${step3Class}`}>
          <span className="step-num">{registered ? "✓" : "3"}</span>
          <div className="step-body">
            <div className="step-name">Registro eERC20</div>
            <div className="step-meta">
              {registered ? "Activo en contrato" : "Claves + ZK on-chain"}
            </div>
          </div>
          <span
            className={`step-badge ${registered ? "badge-done" : step3Class === "current" ? "badge-current" : "badge-pending"}`}
          >
            {registered ? "listo" : "pendiente"}
          </span>
        </li>
      </ol>

      <label className="kyc-check">
        <input
          type="checkbox"
          checked={kycAccepted}
          onChange={(e) => setKycAccepted(e.target.checked)}
        />
        Confirmo operar como institución autorizada (KYC demo).
      </label>

      {!registered ? (
        <button
          type="button"
          className="primary-btn"
          disabled={busy || !walletDone || !kycDone || !sdkReady}
          onClick={handleRegister}
        >
          {busy ? "Registrando…" : "Registrar en eERC20"}
        </button>
      ) : (
        <button
          type="button"
          className="primary-btn"
          disabled={!hasDecryptionKey}
          onClick={() => router.push("/transferencias")}
        >
          {hasDecryptionKey
            ? "Ir a transferencias"
            : "Importá la clave local primero"}
        </button>
      )}

      <KeyBackupPanel />

      <ImportDemoKey />

      <div className="note" role="note">
        Contrato {shortAddress(contractAddress)} · auditor{" "}
        {sdk.isAuditorKeySet ? "configurado" : "pendiente"}
      </div>
    </PageShell>
  );
}
