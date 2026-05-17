"use client";

import { useCallback, useRef, useState } from "react";
import { useAccount } from "wagmi";

import { Feedback } from "@/components/feedback";
import { useCelloEerc } from "@/contexts/eerc-context";
import {
  buildKeyBackup,
  downloadKeyBackup,
  readKeyBackupFile,
  parseKeyBackupText,
} from "@/lib/decryption-key-storage";

type Mode = "export" | "import";

export function KeyBackupPanel() {
  const { address } = useAccount();
  const { hasDecryptionKey, persistDecryptionKey } = useCelloEerc();

  const [mode, setMode] = useState<Mode>(hasDecryptionKey ? "export" : "import");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    setMsg(null);
    const key = localStorage.getItem("cello-eerc-decryption-key");
    if (!key || !address) {
      setMsg("No hay clave para exportar.");
      return;
    }
    const payload = buildKeyBackup(address, key);
    downloadKeyBackup(payload);
    setMsg("Archivo descargado. Guardalo en un lugar seguro.");
  }, [address]);

  const handleFile = useCallback(
    async (file: File) => {
      setBusy(true);
      setMsg(null);
      try {
        const data = await readKeyBackupFile(file);
        if (address && data.address.toLowerCase() !== address.toLowerCase()) {
          setMsg(
            `Advertencia: el backup pertenece a ${data.address.slice(0, 8)}… y vos sos ${address.slice(0, 8)}…. Solo podrás descifrar si la clave coincide con tu registro on-chain.`
          );
        }
        persistDecryptionKey(data.decryptionKey);
        setMsg("Clave importada correctamente.");
        setMode("export");
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Error al importar.");
      } finally {
        setBusy(false);
      }
    },
    [address, persistDecryptionKey]
  );

  const handlePasteImport = useCallback(() => {
    setMsg(null);
    if (!pasted.trim()) {
      setMsg("Pegá el contenido del archivo de respaldo.");
      return;
    }
    try {
      const data = parseKeyBackupText(pasted.trim());
      if (address && data.address.toLowerCase() !== address.toLowerCase()) {
        setMsg(
          `Advertencia: el backup pertenece a ${data.address.slice(0, 8)}… y vos sos ${address.slice(0, 8)}….`
        );
      }
      persistDecryptionKey(data.decryptionKey);
      setMsg("Clave importada correctamente.");
      setPasted("");
      setMode("export");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Texto inválido.");
    }
  }, [pasted, address, persistDecryptionKey]);

  return (
    <div className="panel mt-4">
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          className={`text-xs px-2 py-1 rounded ${mode === "export" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg3)]"}`}
          onClick={() => setMode("export")}
        >
          Exportar
        </button>
        <button
          type="button"
          className={`text-xs px-2 py-1 rounded ${mode === "import" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg3)]"}`}
          onClick={() => setMode("import")}
        >
          Importar
        </button>
      </div>

      {mode === "export" ? (
        <>
          <p className="panel-label mb-1">Respaldo de clave</p>
          <p className="panel-text text-sm mb-3">
            Descargá un archivo JSON con tu clave de descifrado. Guardalo en un lugar seguro.
          </p>
          <button
            type="button"
            className="primary-btn"
            onClick={handleExport}
            disabled={!hasDecryptionKey}
          >
            Descargar respaldo
          </button>
        </>
      ) : (
        <>
          <p className="panel-label mb-1">Importar clave</p>
          <p className="panel-text text-sm mb-3">
            Si cambiaste de navegador o dispositivo, cargá tu clave desde el archivo de respaldo.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <button
            type="button"
            className="primary-btn mb-3"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? "Leyendo…" : "Seleccionar archivo .json"}
          </button>

          <p className="panel-text text-xs text-center mb-2">o pegá el contenido</p>
          <textarea
            className="fl-input font-mono text-xs mb-2"
            rows={4}
            placeholder='{"version":1,"address":"0x...","decryptionKey":"..."}'
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
          />
          <button
            type="button"
            className="primary-btn"
            disabled={busy || !pasted.trim()}
            onClick={handlePasteImport}
          >
            Importar desde texto
          </button>
        </>
      )}

      <Feedback
        message={msg}
        variant={msg?.includes("correctamente") || msg?.includes("descargado") ? "success" : "info"}
        className="mt-3"
      />
    </div>
  );
}
