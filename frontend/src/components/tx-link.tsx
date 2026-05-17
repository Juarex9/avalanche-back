import { explorerTxUrl } from "@/lib/explorer";
import { shortAddress } from "@/lib/format-address";

type TxLinkProps = {
  hash: `0x${string}` | string;
  label?: string;
};

export function TxLink({ hash, label }: TxLinkProps) {
  const display = label ?? shortAddress(hash);
  return (
    <a
      href={explorerTxUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--blue)] underline-offset-2 hover:underline"
    >
      {display}
      <span aria-hidden>↗</span>
    </a>
  );
}
