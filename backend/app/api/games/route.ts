import { createGameRequestSchema } from '@grok-hack/api-contract';
import { after } from 'next/server';

import { createGame, runGamePipeline } from '@/lib/games/create-game';
import { empty, errorBody, json, validationError } from '@/lib/http';
import { publicOrigin } from '@/lib/public-origin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export function OPTIONS(request: Request) {
  return empty(request);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    console.error('POST /api/games rejected a body that was not JSON', error);
    return json(request, errorBody('invalid_json', 'Request body must be JSON.'), 400);
  }

  const parsed = createGameRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return json(request, validationError(parsed.error), 400);
  }

  try {
    const game = await createGame(parsed.data);
    const origin = publicOrigin(request);
    const job = runGamePipeline(game.id, origin);
    after(() => job);
    console.info('Queued game', { gameId: game.id });
    return json(request, game, 202);
  } catch (error) {
    console.error('POST /api/games failed', error);
    return json(request, errorBody('internal_error', 'Could not create the game.'), 500);
  }
}
