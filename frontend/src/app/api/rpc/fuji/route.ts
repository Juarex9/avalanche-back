import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_UPSTREAM = "https://api.avax-test.network/ext/bc/C/rpc";

function resolveUpstreamRpcUrl(): string {
  const serverOnly = process.env.FUJI_RPC_UPSTREAM_URL?.trim();
  if (serverOnly && /^https?:\/\//i.test(serverOnly)) return serverOnly;
  const fromPublic = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC?.trim();
  if (fromPublic && /^https?:\/\//i.test(fromPublic)) return fromPublic;
  return getPublicEnv().fujiRpc || DEFAULT_UPSTREAM;
}

/**
 * Proxy JSON-RPC hacia Fuji: el browser solo habla con tu dominio (evita CORS
 * y URLs de RPC mal copiadas en el cliente).
 */
export async function POST(req: NextRequest) {
  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const upstream = resolveUpstreamRpcUrl();
  let res: Response;
  try {
    res = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "upstream_fetch_failed",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    );
  }

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type":
        res.headers.get("Content-Type") || "application/json; charset=utf-8",
    },
  });
}

export function GET() {
  return new NextResponse("Use POST (JSON-RPC)", { status: 405 });
}
