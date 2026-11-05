import type { AgentKey, AgentState } from '@/lib/flow/types';
import { Icon } from './Icon';

export type AgentPose = AgentState | 'head';
export type AgentMotion = 'bob' | 'work' | 'done' | 'wait' | 'still';
export type AgentSize =
  | 's44'
  | 's48'
  | 's56'
  | 's60'
  | 's72'
  | 's88'
  | 's120'
  | 's150'
  | 's176'
  | 's200'
  | 's220'
  | 's240';

const MOTION_CLASS: Record<AgentMotion, string> = {
  bob: 'bob',
  work: 'work',
  done: 'done',
  wait: 'wait',
  still: '',
};

export const AGENT_NAMES: Record<AgentKey, string> = {
  robo: 'Robo',
  prof: 'Prof',
  spark: 'Spark',
  doodle: 'Doodle',
  lens: 'Lens',
};

export function agentImage(agent: AgentKey, pose: AgentPose): string {
  return `/brand/agents/${agent}-${pose}.svg`;
}

type AgentProps = {
  agent: AgentKey;
  pose?: AgentPose;
  size: AgentSize;
  motion?: AgentMotion;
  alt?: string;
  badge?: 'none' | 'ok' | 'ok-xl';
};

export function Agent({
  agent,
  pose = 'idle',
  size,
  motion = 'still',
  alt = '',
  badge = 'none',
}: AgentProps) {
  const classes = ['ag', size, MOTION_CLASS[motion], `c-${agent}`];
  const className = classes.filter((name) => name !== '').join(' ');
  const src = agentImage(agent, pose);
  const badgeClass = badge === 'ok-xl' ? 'ok xl' : 'ok';

  return (
    <div className={className}>
      <img src={src} alt={alt} />
      {badge !== 'none' && (
        <span className={badgeClass}>
          <Icon name="check" />
        </span>
      )}
    </div>
  );
}
