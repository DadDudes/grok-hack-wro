'use client';

import type { KidProfile } from '@/lib/flow/types';
import { findKid } from '../format';
import { useFlow, type Flow } from '../state/FlowProvider';
import { useParentSession } from '../state/useParentSession';

export type KidContext = Flow & {
  kid: KidProfile;
  kids: KidProfile[];
};

export function useKidContext(): KidContext {
  const flow = useFlow();
  const session = useParentSession();
  const kidId = flow.state.goal?.kidId ?? flow.state.draftKidId;
  const found = findKid(session.kids, kidId);
  const kid = found ?? session.kids[0];
  const ready = flow.ready && session.ready;

  return { ...flow, ready, kid, kids: session.kids };
}
