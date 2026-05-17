"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

import { Feedback } from "@/components/feedback";
import { useCelloEerc } from "@/contexts/eerc-context";

export function ImportDemoKey() {
  const { address } = useAccount();
  const { sdk, hasDecryptionKey, persistDecryptionKey } = useCelloEerc();
  const [open, setOpen] = useState(!hasDecryptionKey);
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!sdk.isRegistered) return null;

  async function unlockFromDeploy() {
    if (!address) {
      setMsg("Conectá la wallet demo en Fuji primero.");
      return;
    }
    if (!passphrase.trim()) {
      setMsg("Ingresá el código de equipo (lo comparte el equipo en la hackathon).");
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/demo/unlock-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          passphrase: passphrase.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        decryptionKey?: string;
        error?: string;
      };
      if (!res.ok || !data.decryptionKey) {
        setMsg(data.error ?? "No se pudo desbloquear la clave en el servidor.");
        return;
      }
      persistDecryptionKey(data.decryptionKey);
      setPassphrase("");
      setMsg("Clave cargada desde el deploy. Andá a Transferencias.");
    } catch {
      setMsg("Error de red al contactar el servidor de demo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel mt-4">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <p className="panel-label mb-0">
          {hasDecryptionKey
            ? "Clave institucional en sesión"
            : "Wallet ya registrada: desbloquear en producción"}
        </p>
        <p className="panel-text text-sm mt-1">
          Usá el código del equipo — funciona en cello-avax.vercel.app sin consola.
        </p>
      </button>
      {open && !hasDecryptionKey ? (
        <div className="mt-3 space-y-2">
          <label className="fl">
            <span className="fl-label">Código de equipo (demo)</span>
            <input
              className="fl-input"
              type="password"
              autoComplete="off"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Código hackathon"
            />
          </label>
          <button
            type="button"
            className="primary-btn"
            disabled={busy}
            onClick={() => void unlockFromDeploy()}
          >
            {busy ? "Desbloqueando…" : "Cargar clave desde el deploy"}
          </button>
          <Feedback
            message={msg}
            variant={msg?.includes("cargada") ? "success" : "info"}
          />
        </div>
      ) : null}
      {hasDecryptionKey && msg ? (
        <Feedback message={msg} variant="success" />
      ) : null}
    </div>
  );
}
