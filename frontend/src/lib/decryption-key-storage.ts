const STORAGE_KEY = "cello-eerc-decryption-key";
const LEGACY_STORAGE_KEY = "veila-eerc-decryption-key";

export function loadDecryptionKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return (
      sessionStorage.getItem(STORAGE_KEY) ??
      sessionStorage.getItem(LEGACY_STORAGE_KEY) ??
      undefined
    );
  } catch {
    return undefined;
  }
}

export function saveDecryptionKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, key);
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
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
