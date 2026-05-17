"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";

import { ThemeProvider } from "@/components/theme-provider";
import { EercProvider } from "@/contexts/eerc-context";
import { createWagmiConfig } from "@/lib/wagmi-config";

type ProvidersProps = {
  children: ReactNode;
  /** Origen público (ej. https://cello.example) — circuits WASM/zkey y coherencia con el proxy. */
  appOrigin: string;
  /** URL absoluta del RPC Fuji (misma que usó el layout para cookies SSR). */
  fujiTransportRpcUrl: string;
  initialState?: State;
};

export function Providers({
  children,
  appOrigin,
  fujiTransportRpcUrl,
  initialState,
}: ProvidersProps) {
  const [wagmiConfig] = useState(
    () => createWagmiConfig(fujiTransportRpcUrl),
  );

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <EercProvider appOrigin={appOrigin}>{children}</EercProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
