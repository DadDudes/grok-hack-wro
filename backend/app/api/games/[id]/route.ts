import { z } from 'zod';

import { getGame } from '@/lib/games/get-game';
import { empty, errorBody, json } from '@/lib/http';

export const dynamic = 'force-dynamic';

const gameIdSchema = z.uuid();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS(request: Request) {
  return empty(request);
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = gameIdSchema.safeParse(id);
  if (!parsed.success) {
    return json(
      request,
      errorBody('validation_error', 'Game id must be a UUID.', [
        { path: 'id', message: 'Game id must be a UUID.' },
      ]),
      400,
    );
  }

  try {
    const game = await getGame(parsed.data);
    if (!game) {
      return json(request, errorBody('not_found', 'Game not found.'), 404);
    }
    return json(request, game);
  } catch (error) {
    console.error('GET /api/games/:id failed', error);
    return json(request, errorBody('internal_error', 'Could not load the game.'), 500);
  }
}
