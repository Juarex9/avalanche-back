"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { avalancheFuji } from "wagmi/chains";

import { shortAddress } from "@/lib/format-address";

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();

  const injected = connectors.find((c) => c.id === "injected");

  if (!isConnected || !address) {
    return (
      <div className="wallet-actions">
        <button
          type="button"
          className="wallet-pill"
          disabled={isPending || !injected}
          onClick={() => injected && connect({ connector: injected })}
        >
          <span className="w-dot" aria-hidden />
          {isPending ? "Conectando…" : "Conectar wallet"}
        </button>
        {!injected ? (
          <p className="wallet-hint">
            Instalá{" "}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
            >
              MetaMask
            </a>{" "}
            para continuar.
          </p>
        ) : null}
        {error ? <p className="wallet-error">{error.message}</p> : null}
      </div>
    );
  }

  const wrongNetwork = chainId !== avalancheFuji.id;

  return (
    <div className="wallet-actions">
      <button type="button" className="wallet-pill" onClick={() => disconnect()}>
        <span className="w-dot" aria-hidden />
        {shortAddress(address)}
      </button>
      {wrongNetwork ? (
        <button
          type="button"
          className="network-warn-btn"
          disabled={switching}
          onClick={() => switchChain({ chainId: avalancheFuji.id })}
        >
          {switching ? "Cambiando…" : "Usar Avalanche Fuji"}
        </button>
      ) : null}
    </div>
  );
}
