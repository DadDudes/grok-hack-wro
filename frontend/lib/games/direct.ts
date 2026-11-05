import type { CreateGameRequest, Game } from '@grok-hack/api-contract';

import { createGame, GamesApiError, waitForGame } from '@/lib/games-api/client';

export async function createAndWait(
  input: CreateGameRequest,
  signal: AbortSignal | undefined,
  origin: string,
): Promise<Game> {
  if (origin.trim() === '') {
    throw new GamesApiError('unreachable', 'missing origin');
  }

  const created = await createGame(input, signal);
  return waitForGame(created, signal);
}
