import type { ReactNode } from 'react';
import type { AgentKey } from '@/lib/flow/types';
import { Agent } from './Agent';
import { Icon } from './Icon';

type TryAgainProps = {
  tone: 'kid' | 'parent';
  agent: AgentKey;
  title: string;
  text: string;
  onRetry: () => void;
  retryLabel?: string;
  children?: ReactNode;
};

export function TryAgain({
  tone,
  agent,
  title,
  text,
  onRetry,
  retryLabel = 'Try again',
  children,
}: TryAgainProps) {
  if (tone === 'kid') {
    return (
      <section className="oops-kid" role="alert">
        <div className="agent-lead">
          <Agent agent={agent} pose="idle" size="s150" motion="bob" alt="" />
          <p className="say l oops">
            <b>{title}</b> {text}
          </p>
        </div>
        <div className="kid-actions">
          <button className="cta" type="button" onClick={onRetry}>
            <Icon name="refresh" />
            {retryLabel}
          </button>
          {children}
        </div>
      </section>
    );
  }

  return (
    <section className="panel pad oops-parent" role="alert">
      <div className="talk">
        <Agent agent={agent} pose="idle" size="s88" alt="" />
        <p className="say l oops par">
          <b>{title}</b> {text}
        </p>
      </div>
      <div className="oops-actions">
        <button className="cta teal sm fit" type="button" onClick={onRetry}>
          <Icon name="refresh" />
          {retryLabel}
        </button>
        {children}
      </div>
    </section>
  );
}
