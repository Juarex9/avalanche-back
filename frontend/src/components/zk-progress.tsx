"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { id: "proving", label: "Generando prueba ZK" },
  { id: "signing", label: "Firmando en wallet" },
  { id: "submitting", label: "Enviando transacción" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function ZkProgress() {
  const [step, setStep] = useState<StepId>("proving");

  useEffect(() => {
    const signTimer = window.setTimeout(() => setStep("signing"), 12_000);
    const submitTimer = window.setTimeout(() => setStep("submitting"), 45_000);
    return () => {
      window.clearTimeout(signTimer);
      window.clearTimeout(submitTimer);
    };
  }, []);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div
      className="zk-progress mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-4 py-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-[var(--text4)]">
        Proceso ZK · 1–2 min
      </p>
      <ol className="zk-progress-steps">
        {STEPS.map((s, i) => {
          const done = i < stepIndex;
          const current = i === stepIndex;
          return (
            <li
              key={s.id}
              className={`zk-progress-step ${done ? "done" : ""} ${current ? "current" : ""}`}
            >
              <span className="zk-progress-dot" aria-hidden />
              {s.label}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-[11px] text-[var(--text3)]">
        No cierres esta pestaña hasta confirmar en wallet.
      </p>
    </div>
  );
}
