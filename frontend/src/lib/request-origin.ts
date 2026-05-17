/** Origen público de la request (Vercel / reverse proxy / local). */
export function getRequestOrigin(headersList: Headers): string {
  const host =
    headersList.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    headersList.get("host") ||
    "localhost:3000";
  const protoHeader = headersList
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const proto =
    protoHeader ||
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
