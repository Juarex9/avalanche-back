import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";

import { Providers } from "@/components/providers";
import { getPublicEnv } from "@/lib/env";
import { getRequestOrigin } from "@/lib/request-origin";
import { createWagmiConfig } from "@/lib/wagmi-config";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cello · Pagos eERC20 + auditoría CNBV",
  description:
    "Pagos institucionales privados en Avalanche Fuji con EncryptedERC (eERC20), ZK y panel regulatorio.",
  openGraph: {
    title: "Cello · eERC20 en Avalanche",
    description:
      "Privados para el sistema financiero · auditables para el regulador. Hackathon Avalanche LatAm.",
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cello · eERC20 + compliance",
    description: "Pagos institucionales privados con auditoría nativa en Avalanche.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";
  const appOrigin = getRequestOrigin(headersList);
  const useDirectRpc = process.env.NEXT_PUBLIC_FUJI_RPC_DIRECT === "1";
  const fujiTransportRpcUrl = useDirectRpc
    ? getPublicEnv().fujiRpc
    : `${appOrigin}/api/rpc/fuji`;
  const wagmiConfigForCookie = createWagmiConfig(fujiTransportRpcUrl);
  const initialState = cookieToInitialState(wagmiConfigForCookie, cookieHeader);

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="cello-theme";var s=localStorage.getItem(k);var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.setAttribute("data-theme","dark")}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <Providers
          appOrigin={appOrigin}
          fujiTransportRpcUrl={fujiTransportRpcUrl}
          initialState={initialState}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
