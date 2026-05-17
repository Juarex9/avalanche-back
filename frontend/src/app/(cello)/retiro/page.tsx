"use client";

import { type FormEvent, useState } from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";

import { Feedback } from "@/components/feedback";
import { TxLink } from "@/components/tx-link";
import { EncBadge } from "@/components/cello/enc-badge";
import { PageHeader } from "@/components/cello/page-header";
import { PageShell } from "@/components/cello/page-shell";
import { WalletStatus } from "@/components/cello/wallet-status";
import { ZkProgress } from "@/components/zk-progress";
import {
  useEncryptedBalanceHook,
  useCelloEerc,
} from "@/contexts/eerc-context";
import { getEercContractAddress } from "@/lib/contracts";
import { loadDecryptionKey } from "@/lib/decryption-key-storage";
import { formatTransferError } from "@/lib/format-transfer-error";
import { shortAddress } from "@/lib/format-address";

function sanitizeAmount(raw: string): string {
  let v = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  return v;
}

export default function RetiroPage() {
  const { address, isConnected } = useAccount();
  const { sdk, hasDecryptionKey, persistDecryptionKey } = useCelloEerc();
  const balance = useEncryptedBalanceHook();
  const contract = getEercContractAddress();

  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState<`0x${string}` | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const decimals = balance.decimals ? Number(balance.decimals) : 18;
  const bal = balance.parsedDecryptedBalance ?? "—";
  const available = balance.decryptedBalance ?? 0n;

  if (!sdk.isConverter) {
    return (
      <PageShell width="narrow">
        <PageHeader
          kicker="Retiro"
          title="Modo no disponible"
          description="Esta función solo está disponible en modo converter."
        />
        <p className="panel-text">
          El contrato actual está en modo standalone. No hay tokens ERC20 para retirar.
        </p>
      </PageShell>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      if (!isConnected || !address) {
        setErr("Conectá tu wallet en Fuji.");
        return;
      }
      if (!sdk.isRegistered) {
        setErr("Completá el registro en /registro antes de retirar.");
        return;
      }
      const storedKey = loadDecryptionKey();
      if (!storedKey) {
        setErr("Falta la clave de descifrado. Completá /registro o importá tu clave.");
        return;
      }
      if (!hasDecryptionKey) {
        persistDecryptionKey(storedKey);
        setMsg("Clave cargada. Pulsá Retirar de nuevo.");
        return;
      }

      const cleanAmount = sanitizeAmount(amount);
      if (!cleanAmount || cleanAmount === "." || parseFloat(cleanAmount) <= 0) {
        setErr("Indicá un monto válido mayor a 0.");
        return;
      }
      const parsed = parseUnits(cleanAmount, decimals);
      if (parsed > available) {
        setErr(`Monto mayor al saldo disponible (${bal}).`);
        return;
      }

      setMsg("Generando prueba ZK de retiro…");
      const result = await balance.withdraw(parsed);
      setLastTx(result.transactionHash as `0x${string}`);
      setMsg("Retiro exitoso. Los tokens ERC20 fueron transferidos a tu wallet.");
      setAmount("");
      balance.refetchBalance();
    } catch (e) {
      setErr(formatTransferError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell width="full">
      <div className="app-layout">
        <aside aria-label="Resumen">
          <div className="bal-block">
            <div className="bal-label">Saldo eERC</div>
            <div className="bal-val">{bal}</div>
            <div className="bal-currency">
              {sdk.symbol || "eERC"} · {shortAddress(contract)}
            </div>
          </div>
          <WalletStatus />
        </aside>

        <div className="main">
          <PageHeader
            kicker="Retiro"
            title="Convertir a ERC20"
            description="Retirá saldo eERC cifrado y recibí tokens ERC20 en tu wallet."
            badge={<EncBadge />}
          />

          <Feedback message={err} variant="error" />
          <Feedback message={msg} variant={msg?.includes("exitoso") ? "success" : "info"} />
          {lastTx ? (
            <p className="tx-feedback">
              Transacción: <TxLink hash={lastTx} />
            </p>
          ) : null}
          {busy ? <ZkProgress /> : null}

          <form className="form-card" onSubmit={onSubmit}>
            <div className="form-card-head">
              <div className="form-card-title">Retiro</div>
              <div className="form-card-meta">Converter · ZK</div>
            </div>
            <div className="fields">
              <div className="fl">
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
                  <span className="currency-sel">eERC</span>
                </div>
              </div>
              <div className="panel-text text-sm">
                Disponible: {bal} eERC
              </div>
            </div>
            <div className="form-footer">
              <button
                type="submit"
                className="submit-btn"
                disabled={busy || !sdk.isRegistered || available <= 0n}
              >
                {busy ? "Retirando…" : "Retirar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
