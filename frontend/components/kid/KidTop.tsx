import Link from 'next/link';
import type { ReactNode } from 'react';
import type { KidProfile } from '@/lib/flow/types';
import { topicLabel } from '../goals';
import { Icon } from '../Icon';
import { KidAvatar } from '../KidAvatar';
import { Lockup } from '../Lockup';

type KidTopProps = {
  backHref?: string;
  children?: ReactNode;
};

export function KidTop({ backHref, children }: KidTopProps) {
  return (
    <header className="kid-top">
      {backHref !== undefined && (
        <Link className="round lg" href={backHref} aria-label="Back">
          <Icon name="back" />
        </Link>
      )}
      <Lockup href="/play" tone="on-teal" />
      <div className="kid-top-end">{children}</div>
    </header>
  );
}

export function KidPill({ kid }: { kid: KidProfile }) {
  return (
    <span className="pill has-head kid-button">
      <KidAvatar name={kid.name} color={kid.color} size="sm" />
      {kid.name}
    </span>
  );
}

export function TopicPill({ topic }: { topic: string }) {
  return (
    <span className="pill sun has-head topic-pill">
      <img src="/brand/agents/prof-head.svg" alt="" width={44} height={44} />
      Today: {topicLabel(topic)}
    </span>
  );
}

export function IdeaPill({ idea, editHref }: { idea: string; editHref?: string }) {
  if (editHref === undefined) {
    return (
      <span className="pill idea-pill">
        <span>{idea}</span>
      </span>
    );
  }

  return (
    <Link className="pill idea-pill" href={editHref} aria-label={`Change your idea: ${idea}`}>
      <span>{idea}</span>
      <Icon name="pencil" />
    </Link>
  );
}
