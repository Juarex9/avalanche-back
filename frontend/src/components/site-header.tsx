"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";
import { useCelloEerc } from "@/contexts/eerc-context";

const BASE_NAV = [
  { href: "/registro", label: "Registro" },
  { href: "/transferencias", label: "Transferencias" },
  { href: "/recibir", label: "Recibir" },
  { href: "/auditoria", label: "Auditoría" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { sdk } = useCelloEerc();

  const nav = sdk.isConverter
    ? [
        { href: "/registro", label: "Registro" },
        { href: "/deposito", label: "Depósito" },
        { href: "/transferencias", label: "Transferencias" },
        { href: "/retiro", label: "Retiro" },
        { href: "/auditoria", label: "Auditoría" },
      ]
    : BASE_NAV;

  return (
    <header className="site-header">
      <div className="site-header-side site-header-side--start">
        <Link href="/" className="logo" aria-label="Cello — inicio">
          <LogoMark />
        </Link>
      </div>

      <nav className="site-header-nav nav-tabs" aria-label="Secciones de la aplicación">
        {nav.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className="tab"
              aria-current={active ? "page" : undefined}
              data-active={active ? "true" : "false"}
              scroll={false}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="site-header-side site-header-side--end nav-right">
        <ThemeToggle />
        <div className="net-pill" title="Red de prueba">
          <span className="net-dot" aria-hidden />
          Avalanche Fuji
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
