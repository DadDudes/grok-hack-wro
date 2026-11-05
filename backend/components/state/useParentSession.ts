'use client';

import type { KidProfile, ParentProfile } from '@/lib/flow/types';
import { createLocalStore } from './localStore';

const SESSION_KEY = 'ebg.session';
const MOCK_PARENT_NAME = 'Anna';

const SEED_KIDS: KidProfile[] = [
  { id: 'maja', name: 'Maja', age: 8, color: '#FF6FA5' },
  { id: 'leo', name: 'Leo', age: 9, color: '#4CC9F0' },
];

type SessionState = {
  parent: ParentProfile | null;
  kids: KidProfile[];
};

const EMPTY_SESSION: SessionState = {
  parent: null,
  kids: SEED_KIDS,
};

const sessionStore = createLocalStore<SessionState>(SESSION_KEY, EMPTY_SESSION);

export type ParentSession = {
  ready: boolean;
  parent: ParentProfile | null;
  kids: KidProfile[];
  login: (email: string) => void;
  logout: () => void;
};

function login(email: string): void {
  const parent: ParentProfile = { name: MOCK_PARENT_NAME, email: email.trim() };
  sessionStore.update((previous) => ({ ...previous, parent }));
}

function logout(): void {
  sessionStore.update((previous) => ({ ...previous, parent: null }));
}

export function useParentSession(): ParentSession {
  const value = sessionStore.useValue();

  if (value === null) {
    return { ready: false, parent: null, kids: EMPTY_SESSION.kids, login, logout };
  }

  return { ready: true, parent: value.parent, kids: value.kids, login, logout };
}
