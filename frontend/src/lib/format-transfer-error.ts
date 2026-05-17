/** Mensajes claros para errores de transferencia / ZK en el browser. */

export function formatTransferError(err: unknown): string {
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";

  if (/failed to fetch/i.test(msg)) {
    return (
      "Error de red (Failed to fetch). Causas frecuentes: " +
      "(1) Proxy RPC `/api/rpc/fuji` — revisá que el dev server esté arriba y el upstream RPC sea válido. " +
      "(2) Prueba ZK — abrí la app con la misma URL que en la barra (localhost vs 127.0.0.1 mezclados rompen la carga de `.wasm`). " +
      "(3) MetaMask: red Fuji y RPC del nodo que no bloquee. " +
      "`NEXT_PUBLIC_FUJI_RPC_DIRECT=1` fuerza RPC directo en el browser. " +
      "Si ya estabas registrado on-chain, importá la clave de descifrado."
    );
  }

  if (/insufficient|balance|saldo/i.test(msg)) {
    return `Saldo insuficiente o no descifrado: ${msg}`;
  }

  return msg || "No se pudo completar la operación eERC.";
}
