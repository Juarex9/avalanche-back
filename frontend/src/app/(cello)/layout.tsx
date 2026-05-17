import { ConfigBanner } from "@/components/config-banner";
import { DemoStatusBar } from "@/components/demo-status-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function CelloSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      <ConfigBanner />
      <SiteHeader />
      <DemoStatusBar />
      {children}
      <SiteFooter />
    </>
  );
}
