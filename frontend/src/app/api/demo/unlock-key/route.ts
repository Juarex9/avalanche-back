import { isAddress } from "viem";

import {
  getDemoDecryptionKey,
  getDemoPassphrase,
  isDemoUnlockConfigured,
  resolveDemoRole,
} from "@/lib/demo-server";

export const dynamic = "force-dynamic";

type Body = {
  walletAddress?: string;
  passphrase?: string;
};

export async function POST(request: Request) {
  if (!isDemoUnlockConfigured()) {
    return Response.json(
      {
        error:
          "Demo unlock no configurado en el servidor. Agregá DEMO_TEAM_PASSPHRASE y claves en Vercel.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const wallet = body.walletAddress?.trim();
  const passphrase = body.passphrase?.trim();

  if (!wallet || !isAddress(wallet)) {
    return Response.json({ error: "walletAddress inválida" }, { status: 400 });
  }
  if (!passphrase) {
    return Response.json({ error: "Falta passphrase" }, { status: 400 });
  }

  if (passphrase !== getDemoPassphrase()) {
    return Response.json({ error: "Código de equipo incorrecto" }, { status: 401 });
  }

  const role = resolveDemoRole(wallet);
  if (!role) {
    return Response.json(
      { error: "Esta wallet no es una cuenta demo de Cello" },
      { status: 403 },
    );
  }

  const decryptionKey = getDemoDecryptionKey(role);
  if (!decryptionKey) {
    return Response.json({ error: "Clave demo no configurada" }, { status: 503 });
  }

  return Response.json({
    ok: true,
    role,
    decryptionKey,
  });
}
