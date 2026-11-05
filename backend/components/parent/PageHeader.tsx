import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '../Icon';

type PageHeaderProps = {
  title: string;
  sub?: string;
  backHref?: string;
  children?: ReactNode;
};

export function PageHeader({ title, sub, backHref, children }: PageHeaderProps) {
  return (
    <header className="phead">
      {backHref !== undefined && (
        <Link className="round" href={backHref} aria-label="Back">
          <Icon name="back" />
        </Link>
      )}
      <div className="tt">
        <h1>{title}</h1>
        {sub !== undefined && <p className="sub">{sub}</p>}
      </div>
      {children}
    </header>
  );
}
