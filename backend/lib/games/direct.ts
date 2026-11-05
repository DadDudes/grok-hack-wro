import { createGameRequestSchema, type CreateGameRequest, type Game } from '@grok-hack/api-contract';

import { GamesApiError } from '@/lib/games-api/client';

import { createGame, runGamePipeline } from './create-game';
import { getGame } from './get-game';

const POLL_INTERVAL_MS = 400;
const READY_TIMEOUT_MS = 180_000;

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error('aborted'));
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function createAndWait(
  input: CreateGameRequest,
  signal: AbortSignal | undefined,
  origin: string,
): Promise<Game> {
  const parsed = createGameRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new GamesApiError('invalid_request', 'create game request is invalid');
  }
  if (origin.trim() === '') {
    throw new GamesApiError('unreachable', 'missing origin');
  }

  const created = await createGame(parsed.data);
  const job = runGamePipeline(created.id, origin);
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let current = created;

  while (current.status !== 'ready' && current.status !== 'failed') {
    if (Date.now() > deadline) {
      throw new GamesApiError('timeout', `game ${created.id} was not ready in time`);
    }
    signal?.throwIfAborted();
    await wait(POLL_INTERVAL_MS, signal);
    const next = await getGame(created.id);
    if (!next) {
      throw new GamesApiError('rejected', `game ${created.id} disappeared`);
    }
    current = next;
  }

  await job.catch((error: unknown) => {
    console.error('Game pipeline failed after the waiter returned', { gameId: created.id, error });
  });
  return (await getGame(created.id)) ?? current;
}
