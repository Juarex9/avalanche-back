import Link from "next/link";

const APP_LINKS = [
  { href: "/registro", label: "Registro" },
  { href: "/transferencias", label: "Transferencias" },
  { href: "/auditoria", label: "Auditoría" },
] as const;

const EXTERNAL_LINKS = [
  { href: "https://docs.avacloud.io/encrypted-erc/welcome", label: "Docs eERC" },
  { href: "https://github.com/Jehp23/avax-compliance", label: "GitHub" },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-brand">Cello · Avalanche Fuji · eERC20</p>
        <nav className="site-footer-nav" aria-label="Enlaces">
          {APP_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="site-footer-link">
              {label}
            </Link>
          ))}
          {EXTERNAL_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-link"
            >
              {label} ↗
            </a>
          ))}
        </nav>
        <p className="site-footer-copy">
          Privados para el sistema financiero · auditables para el regulador
        </p>
      </div>
    </footer>
  );
}
