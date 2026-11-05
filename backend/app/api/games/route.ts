import { createGameRequestSchema } from '@grok-hack/api-contract';

import { createGame } from '@/lib/games/create-game';
import { empty, errorBody, json, validationError } from '@/lib/http';

export const dynamic = 'force-dynamic';

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
    return json(request, game, 201);
  } catch (error) {
    console.error('POST /api/games failed', error);
    return json(request, errorBody('internal_error', 'Could not create the game.'), 500);
  }
}
