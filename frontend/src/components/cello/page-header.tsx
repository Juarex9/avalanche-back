import type { ReactNode } from "react";

type PageHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
  badge?: ReactNode;
};

export function PageHeader({ kicker, title, description, badge }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-body">
        {kicker ? <p className="page-kicker">{kicker}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-desc">{description}</p> : null}
      </div>
      {badge ? <div className="page-header-badge">{badge}</div> : null}
    </header>
  );
}
