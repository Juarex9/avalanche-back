import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
