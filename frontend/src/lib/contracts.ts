import { getPublicEnv, isEercConfigured } from "@/lib/env";
import {
  resolveConverterToken,
  resolveEercContract,
} from "@/lib/eerc-config";

export function getEercContractAddress(): `0x${string}` {
  return resolveEercContract(getPublicEnv());
}

export function getConverterTokenAddress(): `0x${string}` | undefined {
  return resolveConverterToken(getPublicEnv());
}

export { isEercConfigured, getPublicEnv };
