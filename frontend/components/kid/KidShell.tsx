import type { ReactNode } from 'react';
import { SceneDefs } from '../art/SceneDefs';

type KidShellProps = {
  variant?: 'stage' | 'play' | 'party';
  children: ReactNode;
};

const VARIANT_CLASS = {
  stage: 'kid-app',
  play: 'kid-app play-app',
  party: 'kid-app party',
} as const;

export function KidShell({ variant = 'stage', children }: KidShellProps) {
  return (
    <div className={VARIANT_CLASS[variant]}>
      <SceneDefs />
      {children}
    </div>
  );
}
