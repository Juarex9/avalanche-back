import Link from "next/link";

const FEATURES = [
  {
    title: "Privacidad",
    text: "El público ve movimiento, no montos. ZK + ElGamal en cada operación.",
  },
  {
    title: "Auditoría",
    text: "Copia cifrada para el regulador en cada transferencia privada.",
  },
  {
    title: "Avalanche",
    text: "Fuji hoy; mismo stack eERC de Ava Labs listo para producción.",
  },
] as const;

export default function HomePage() {
  return (
    <main id="main-content" className="landing screen">
      <div className="landing-inner">
        <div className="landing-hero">
          <p className="landing-kicker">Cello · Avalanche Fuji · eERC20 · CNBV</p>
          <h1 className="landing-title">
            Pagos institucionales
            <br />
            privados y auditables
          </h1>
          <p className="landing-sub">
            Montos cifrados on-chain con auditoría regulatoria nativa. Cello es la
            capa institucional sobre EncryptedERC.
          </p>
          <div className="landing-cta">
            <Link href="/registro" className="primary-btn landing-cta-primary">
              Probar en Fuji
            </Link>
            <Link href="/auditoria" className="secondary-btn">
              Panel auditoría
            </Link>
          </div>
        </div>

        <div className="landing-stats" aria-label="Capacidades">
          <div className="landing-stat">
            <span className="landing-stat-val">eERC20</span>
            <span className="landing-stat-lbl">Token cifrado</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-val">ZK</span>
            <span className="landing-stat-lbl">Pruebas en cliente</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-val">CNBV</span>
            <span className="landing-stat-lbl">Vista auditor</span>
          </div>
        </div>

        <div className="landing-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="panel">
              <h3 className="panel-title">{f.title}</h3>
              <p className="panel-text">{f.text}</p>
            </article>
          ))}
        </div>

        <p className="landing-diagram" aria-label="Flujo dual-lock">
          <span className="landing-flow-step">Institución</span>
          <span className="landing-flow-arrow" aria-hidden>
            →
          </span>
          <span className="landing-flow-step">ZK privado</span>
          <span className="landing-flow-arrow" aria-hidden>
            →
          </span>
          <span className="landing-flow-step">eERC Fuji</span>
          <span className="landing-flow-arrow" aria-hidden>
            ←
          </span>
          <span className="landing-flow-step">CNBV</span>
        </p>
      </div>
    </main>
  );
}
