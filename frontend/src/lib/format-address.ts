export function shortAddress(
  address: string | undefined,
  visible = 4,
): string {
  if (!address) return "";
  const a = address as `0x${string}`;
  if (a.length <= 2 + visible * 2) return a;
  return `${a.slice(0, 2 + visible)}…${a.slice(-visible)}`;
}
