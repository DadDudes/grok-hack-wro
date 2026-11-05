'use client';

import { useEffect, useState } from 'react';
import { listGoals, subscribeGoals, type GoalRecord } from './goalsStore';

export type GoalsByKid = Record<string, GoalRecord[]>;

export function useKidGoals(kidIds: string[]): GoalsByKid | null {
  const [goals, setGoals] = useState<GoalsByKid | null>(null);
  const idsKey = kidIds.join(',');

  useEffect(() => {
    let active = true;
    const ids = idsKey === '' ? [] : idsKey.split(',');

    async function load(): Promise<void> {
      const loaded: GoalsByKid = {};

      for (const kidId of ids) {
        loaded[kidId] = await listGoals(kidId);
      }

      if (active) {
        setGoals(loaded);
      }
    }

    void load();
    const unsubscribe = subscribeGoals(() => void load());

    return () => {
      active = false;
      unsubscribe();
    };
  }, [idsKey]);

  return goals;
}
