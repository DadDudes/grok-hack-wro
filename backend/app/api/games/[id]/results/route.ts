import { gameResultRequestSchema } from '@grok-hack/api-contract';
import { z } from 'zod';

import { getGameRepository } from '@/lib/games/store';
import { empty, errorBody, json, validationError } from '@/lib/http';

export const dynamic = 'force-dynamic';

const gameIdSchema = z.uuid();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS(request: Request) {
  return empty(request);
}

/**
 * End-of-game score from the Phaser template.
 * Stored for a future analyst agent. Failure to store does not affect play.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsedId = gameIdSchema.safeParse(id);
  if (!parsedId.success) {
    return json(
      request,
      errorBody('validation_error', 'Game id must be a UUID.', [
        { path: 'id', message: 'Game id must be a UUID.' },
      ]),
      400,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    console.error('POST /api/games/:id/results rejected a body that was not JSON', error);
    return json(request, errorBody('invalid_json', 'Request body must be JSON.'), 400);
  }

  const parsed = gameResultRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return json(request, validationError(parsed.error), 400);
  }

  try {
    const saved = await getGameRepository().saveResult(parsedId.data, {
      score: parsed.data.score,
      total: parsed.data.total,
      correct: parsed.data.correct,
      durationMs: parsed.data.durationMs ?? null,
      receivedAt: new Date().toISOString(),
    });
    if (!saved) {
      return json(request, errorBody('not_found', 'Game not found.'), 404);
    }
    return json(request, { ok: true });
  } catch (error) {
    console.error('POST /api/games/:id/results failed', error);
    return json(request, errorBody('internal_error', 'Could not store the result.'), 500);
  }
}
