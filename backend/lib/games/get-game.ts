import type { Game } from '@grok-hack/api-contract';

import { getGameRepository } from './store';

export async function getGame(id: string): Promise<Game | null> {
  return getGameRepository().findById(id);
}
