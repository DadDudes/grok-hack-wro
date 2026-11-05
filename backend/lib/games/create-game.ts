import type { CreateGameRequest, Game } from '@grok-hack/api-contract';

import { deployGame } from '@/lib/services/deploy-game';
import { generateGameCode } from '@/lib/services/generate-game-code';
import { generateGraphics } from '@/lib/services/generate-graphics';
import { storeGameAssets } from '@/lib/services/store-assets';

import type { GameRepository } from './repository';
import { getGameRepository } from './store';

async function runPipeline(repository: GameRepository, game: Game): Promise<Game> {
  try {
    await repository.update(game.id, { status: 'generating' });

    const files = await generateGameCode({
      parentPrompt: game.parentPrompt,
      childPrompt: game.childPrompt,
      childAge: game.childAge,
      language: game.language,
    });
    const graphics = await generateGraphics();
    const stored = await storeGameAssets(game.id, files, graphics);
    const deployed = await deployGame(game.id, stored);

    return await repository.update(game.id, {
      status: 'ready',
      gameUrl: deployed.gameUrl,
      thumbnailUrl: stored.thumbnailUrl,
      coverUrl: stored.coverUrl,
      assetUrls: stored.assetUrls,
      error: null,
    });
  } catch (error) {
    console.error('Game pipeline failed', { gameId: game.id, error });
    return repository.update(game.id, {
      status: 'failed',
      error: 'Game generation failed.',
    });
  }
}

/**
 * Creates the game row, then runs the stub pipeline to `ready`.
 *
 * TODO(async): return the queued row from `insert` and run `runPipeline`
 * in a Vercel Workflow. The route should then respond 202 and the client
 * should poll `GET /api/games/:id` until `ready` or `failed`.
 */
export async function createGame(input: CreateGameRequest): Promise<Game> {
  const repository = getGameRepository();
  const game = await repository.insert({
    parentPrompt: input.parentPrompt,
    childPrompt: input.childPrompt,
    childAge: input.childAge ?? null,
    language: input.language ?? null,
  });
  return runPipeline(repository, game);
}
