import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  /** narrow = onboarding · wide = auditoría · full = transferencias */
  width?: "narrow" | "wide" | "full";
};

export function PageShell({ children, width = "narrow" }: PageShellProps) {
  return (
    <main
      id="main-content"
      className={`cello-page cello-page--${width} screen`}
    >
      {children}
    </main>
  );
}
