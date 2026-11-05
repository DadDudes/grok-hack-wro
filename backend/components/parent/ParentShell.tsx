'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import { KidAvatar } from '../KidAvatar';
import { Lockup } from '../Lockup';
import { useParentSession } from '../state/useParentSession';

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  activeOn: string[];
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/parent', icon: 'home', activeOn: ['/parent'] },
  { label: 'New goal', href: '/parent/goal', icon: 'target', activeOn: ['/parent/goal', '/parent/plan'] },
  { label: 'Reports', href: '/parent/report', icon: 'chart', activeOn: ['/parent/report'] },
  { label: 'Kids', href: '/parent#kids', icon: 'users', activeOn: [] },
];

const PARENT_AVATAR_COLOR = '#FFB3C7';

export function ParentShell({ children }: { children: ReactNode }) {
  const session = useParentSession();
  const router = useRouter();
  const pathname = usePathname();
  const signedOut = session.ready && session.parent === null;

  useEffect(() => {
    if (signedOut) {
      router.replace('/login');
    }
  }, [signedOut, router]);

  if (session.parent === null) {
    return <div className="parent-app" aria-busy="true" />;
  }

  const parent = session.parent;

  return (
    <div className="parent-app">
      <aside className="side">
        <Lockup href="/parent" tone="on-light" size="sm" />
        <nav aria-label="Parent">
          <ul>
            {NAV_ITEMS.map((item) => {
              const isActive = item.activeOn.includes(pathname);
              const current = isActive ? 'page' : undefined;

              return (
                <li key={item.label}>
                  <Link href={item.href} aria-current={current}>
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="bottom">
          <Link className="cta white sm" href="/play">
            <Icon name="pad" />
            Kid mode
          </Link>
          <div className="acct">
            <KidAvatar name={parent.name} color={PARENT_AVATAR_COLOR} />
            <div>
              <b>{parent.name}</b>
              <span>{parent.email}</span>
            </div>
            <button className="edit" type="button" aria-label="Log out" onClick={session.logout}>
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </aside>
      <main className="page">{children}</main>
    </div>
  );
}
