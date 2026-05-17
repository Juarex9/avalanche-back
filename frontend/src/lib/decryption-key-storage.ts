const STORAGE_KEY = "cello-eerc-decryption-key";
const LEGACY_STORAGE_KEY = "veila-eerc-decryption-key";
const LEGACY_SESSION_KEY = "cello-eerc-decryption-key";

export function loadDecryptionKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    // 1. localStorage (new)
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) return local;
    // 2. legacy localStorage
    const legacyLocal = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyLocal) return legacyLocal;
    // 3. legacy sessionStorage (auto-migrate)
    const session = sessionStorage.getItem(LEGACY_SESSION_KEY) ?? sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (session) {
      saveDecryptionKey(session);
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      return session;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function saveDecryptionKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, key);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    // also clear legacy session
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore quota / private mode
  }
}

export function hasDecryptionKey(): boolean {
  return Boolean(loadDecryptionKey());
}

export function clearDecryptionKey(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/* ---------- Export / Import ---------- */

export interface KeyBackupPayload {
  version: 1;
  address: string;
  decryptionKey: string;
  exportedAt: string; // ISO
}

export function buildKeyBackup(address: string, decryptionKey: string): KeyBackupPayload {
  return {
    version: 1,
    address: address.toLowerCase(),
    decryptionKey,
    exportedAt: new Date().toISOString(),
  };
}

export function downloadKeyBackup(payload: KeyBackupPayload, filename?: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `cello-key-${payload.address.slice(0, 8)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readKeyBackupFile(file: File): Promise<KeyBackupPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data || data.version !== 1 || !data.decryptionKey || !data.address) {
          reject(new Error("Archivo de respaldo inválido o versión no soportada."));
          return;
        }
        resolve(data as KeyBackupPayload);
      } catch {
        reject(new Error("No se pudo leer el archivo JSON."));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsText(file);
  });
}

export function parseKeyBackupText(text: string): KeyBackupPayload {
  const data = JSON.parse(text);
  if (!data || data.version !== 1 || !data.decryptionKey || !data.address) {
    throw new Error("Texto de respaldo inválido.");
  }
  return data as KeyBackupPayload;
}
