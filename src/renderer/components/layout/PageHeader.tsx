import type { ReactElement, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps): ReactElement {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-white">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#9f9f9f]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
