import { z } from 'zod';

import { getGame } from '@/lib/games/get-game';
import { getGameRepository } from '@/lib/games/store';
import { emptyAssets } from '@/lib/game-spec/fallback';
import { htmlResponse, renderPlayHtml, renderStatusHtml } from '@/lib/play/render-html';

export const dynamic = 'force-dynamic';

const gameIdSchema = z.uuid();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = gameIdSchema.safeParse(id);
  if (!parsed.success) {
    return htmlResponse(
      renderStatusHtml({ title: 'Gra', message: 'Id gry musi być UUID.', refresh: false }),
      400,
    );
  }

  try {
    const game = await getGame(parsed.data);
    if (!game) {
      return htmlResponse(
        renderStatusHtml({ title: 'Gra', message: 'Nie ma takiej gry.', refresh: false }),
        404,
      );
    }
    if (game.status === 'failed') {
      return htmlResponse(
        renderStatusHtml({
          title: 'Gra',
          message: game.error ?? 'Nie udało się utworzyć gry.',
          refresh: false,
        }),
        200,
      );
    }
    if (game.status !== 'ready') {
      return htmlResponse(
        renderStatusHtml({
          title: 'Gra się tworzy',
          message: 'Gra się jeszcze tworzy. Ta strona odświeży się sama.',
          refresh: true,
        }),
        200,
      );
    }

    const spec = await getGameRepository().getSpec(parsed.data);
    if (!spec) {
      console.error('Ready game has no spec', { gameId: parsed.data });
      return htmlResponse(
        renderStatusHtml({ title: 'Gra', message: 'Brakuje opisu gry.', refresh: false }),
        404,
      );
    }

    const shapes = new URL(request.url).searchParams.get('assets') === 'shapes';
    const rendered = shapes ? { ...spec, assets: emptyAssets() } : spec;
    return htmlResponse(renderPlayHtml(rendered));
  } catch (error) {
    console.error('GET /play/:id failed', error);
    return htmlResponse(
      renderStatusHtml({ title: 'Gra', message: 'Nie udało się wczytać gry.', refresh: false }),
      500,
    );
  }
}
