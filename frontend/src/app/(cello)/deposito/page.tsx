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
import { getConverterTokenAddress, getEercContractAddress } from "@/lib/contracts";
import { loadDecryptionKey } from "@/lib/decryption-key-storage";
import { formatTransferError } from "@/lib/format-transfer-error";
import { shortAddress } from "@/lib/format-address";

function sanitizeAmount(raw: string): string {
  let v = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  return v;
}

export default function DepositoPage() {
  const { address, isConnected } = useAccount();
  const { sdk, hasDecryptionKey, persistDecryptionKey } = useCelloEerc();
  const balance = useEncryptedBalanceHook();
  const contract = getEercContractAddress();
  const tokenAddress = getConverterTokenAddress();

  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState<`0x${string}` | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const decimals = balance.decimals ? Number(balance.decimals) : 18;
  const bal = balance.parsedDecryptedBalance ?? "—";

  if (!sdk.isConverter) {
    return (
      <PageShell width="narrow">
        <PageHeader
          kicker="Depósito"
          title="Modo no disponible"
          description="Esta función solo está disponible en modo converter."
        />
        <p className="panel-text">
          El contrato actual está en modo standalone. No es necesario depositar tokens ERC20.
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
        setErr("Completá el registro en /registro antes de depositar.");
        return;
      }
      const storedKey = loadDecryptionKey();
      if (!storedKey) {
        setErr("Falta la clave de descifrado. Completá /registro o importá tu clave.");
        return;
      }
      if (!hasDecryptionKey) {
        persistDecryptionKey(storedKey);
        setMsg("Clave cargada. Pulsá Depositar de nuevo.");
        return;
      }
      if (!tokenAddress) {
        setErr("Token ERC20 subyacente no configurado.");
        return;
      }

      const cleanAmount = sanitizeAmount(amount);
      if (!cleanAmount || cleanAmount === "." || parseFloat(cleanAmount) <= 0) {
        setErr("Indicá un monto válido mayor a 0.");
        return;
      }

      setMsg("Generando prueba ZK de depósito…");
      const parsed = parseUnits(cleanAmount, decimals);
      const result = await balance.deposit(parsed);
      setLastTx(result.transactionHash as `0x${string}`);
      setMsg("Depósito exitoso. Tu saldo eERC está cifrado on-chain.");
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
            kicker="Depósito"
            title="Convertir a eERC"
            description="Depositá tokens ERC20 para obtener saldo eERC cifrado."
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
              <div className="form-card-title">Depósito</div>
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
                  <span className="currency-sel">ERC20</span>
                </div>
              </div>
              <div className="panel-text text-sm">
                Token subyacente: {tokenAddress ? shortAddress(tokenAddress) : "no configurado"}
              </div>
            </div>
            <div className="form-footer">
              <button
                type="submit"
                className="submit-btn"
                disabled={busy || !sdk.isRegistered || !tokenAddress}
              >
                {busy ? "Depositando…" : "Depositar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
