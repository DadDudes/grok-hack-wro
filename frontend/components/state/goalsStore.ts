import type { GameOption, Goal, Report, SessionResult, TaskPlan } from '@/lib/flow/types';

const KEY_PREFIX = 'ebg.goals.';
const CHANGE_EVENT = 'ebg-goals-change';

export type GoalStatus = 'planned' | 'playing' | 'report';

export type GoalRecord = {
  id: string;
  kidId: string;
  createdAt: string;
  updatedAt: string;
  goal: Goal;
  plan: TaskPlan;
  status: GoalStatus;
  kidIdea: string | null;
  option: GameOption | null;
  gameId: string | null;
  session: SessionResult | null;
  report: Report | null;
};

export type GoalPatch = Partial<
  Pick<GoalRecord, 'plan' | 'status' | 'kidIdea' | 'option' | 'gameId' | 'session' | 'report'>
>;

function readKid(kidId: string): GoalRecord[] {
  try {
    const raw = window.localStorage.getItem(`${KEY_PREFIX}${kidId}`);

    if (raw === null) {
      return [];
    }

    return JSON.parse(raw) as GoalRecord[];
  } catch {
    return [];
  }
}

function writeKid(kidId: string, goals: GoalRecord[]): boolean {
  try {
    const serialized = JSON.stringify(goals);
    window.localStorage.setItem(`${KEY_PREFIX}${kidId}`, serialized);
  } catch {
    return false;
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

export async function listGoals(kidId: string): Promise<GoalRecord[]> {
  return readKid(kidId);
}

export async function createGoal(goal: Goal, plan: TaskPlan): Promise<GoalRecord> {
  const now = new Date().toISOString();
  const record: GoalRecord = {
    id: crypto.randomUUID(),
    kidId: goal.kidId,
    createdAt: now,
    updatedAt: now,
    goal,
    plan,
    status: 'planned',
    kidIdea: null,
    option: null,
    gameId: null,
    session: null,
    report: null,
  };

  const goals = readKid(goal.kidId);
  writeKid(goal.kidId, [record, ...goals]);
  return record;
}

export async function updateGoal(kidId: string, goalId: string, patch: GoalPatch): Promise<GoalRecord | null> {
  const goals = readKid(kidId);
  const index = goals.findIndex((record) => record.id === goalId);

  if (index < 0) {
    return null;
  }

  const updated: GoalRecord = { ...goals[index], ...patch, updatedAt: new Date().toISOString() };
  const next = [...goals];
  next[index] = updated;
  writeKid(kidId, next);
  return updated;
}

export function subscribeGoals(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
