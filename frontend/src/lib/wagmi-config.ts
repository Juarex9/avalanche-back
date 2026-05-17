import { createConfig, createStorage, http, cookieStorage } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * @param fujiRpcHttpUrl URL absoluta del transporte JSON-RPC (p. ej. mismo
 * origen + `/api/rpc/fuji` vía layout, o RPC público si `FUJI_RPC_DIRECT`).
 */
export function createWagmiConfig(fujiRpcHttpUrl: string) {
  return createConfig({
    chains: [avalancheFuji],
    connectors: [
      injected({
        shimDisconnect: true,
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [avalancheFuji.id]: http(fujiRpcHttpUrl),
    },
  });
}
