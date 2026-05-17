"use client";

import { useEffect, useState } from "react";

export function useCircuitsReady() {
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/circuits/RegistrationCircuit.wasm", { method: "HEAD" })
      .then((r) => setReady(r.ok))
      .catch(() => setReady(false));
  }, []);

  return ready;
}
