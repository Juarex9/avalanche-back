import { getPublicEnv } from "@/lib/env";

export type VerifiedCounterparty = {
  initials: string;
  name: string;
  addrShort: string;
  address?: `0x${string}`;
};

export function getVerifiedCounterparties(): VerifiedCounterparty[] {
  const env = getPublicEnv();
  return [
    {
      initials: "BK",
      name: "Bankaool",
      addrShort: "Bankaool",
      address: env.demoCounterparties.bankaool,
    },
    {
      initials: "FN",
      name: "FinNova MX",
      addrShort: "FinNova",
      address: env.demoCounterparties.finnova,
    },
    {
      initials: "RL",
      name: "RutaLog AR",
      addrShort: "RutaLog",
      address: env.demoCounterparties.rutalog,
    },
  ];
}
