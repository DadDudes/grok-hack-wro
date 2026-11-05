import type { Game } from '@grok-hack/api-contract';
import type { Goal } from '@/lib/flow/types';

export const LOCAL_DEMO_GAME_URL = '/demo-game/index.html';

export function localDemoGame(goal: Goal, kidIdea: string): Game {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  return {
    id,
    parentPrompt: goal.topic,
    childPrompt: kidIdea,
    childAge: goal.age,
    language: goal.language,
    status: 'ready',
    gameUrl: LOCAL_DEMO_GAME_URL,
    graphics: { thumbnailUrl: null, coverUrl: null, assetUrls: [] },
    error: null,
    createdAt: now,
    updatedAt: now,
  };
}
