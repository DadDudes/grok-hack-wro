import type { CreateGameRequest, Game } from '@grok-hack/api-contract';

import { generateGameCode } from '@/lib/services/generate-game-code';
import { generateGraphics } from '@/lib/services/generate-graphics';
import { deployGame } from '@/lib/services/deploy-game';
import { storeGameAssets } from '@/lib/services/store-assets';

import { readGameRequest, rememberGameRequest } from './request-memory';
import type { GameRepository } from './repository';
import { getGameRepository } from './store';

/**
 * Inserts a queued row and returns it. The route schedules `runGamePipeline`
 * with `after()` so the HTTP response does not wait for generation.
 */
export async function createGame(input: CreateGameRequest): Promise<Game> {
  const repository = getGameRepository();
  const game = await repository.insert({
    parentPrompt: input.parentPrompt,
    childPrompt: input.childPrompt,
    childAge: input.childAge ?? null,
    language: input.language ?? null,
  });
  rememberGameRequest(game.id, {
    template: input.template,
    questionCount: input.questionCount,
    tasks: input.tasks,
  });
  return game;
}

export async function runGamePipeline(
  gameId: string,
  origin: string,
  repository: GameRepository = getGameRepository(),
): Promise<void> {
  try {
    const game = await repository.findById(gameId);
    if (!game) return;

    await repository.update(gameId, { status: 'generating', error: null });
    console.info('Generating game', { gameId, language: game.language ?? 'pl' });

    const extra = readGameRequest(gameId);
    const built = await generateGameCode({
      gameId,
      parentPrompt: game.parentPrompt,
      childPrompt: game.childPrompt,
      childAge: game.childAge,
      language: game.language,
      template: extra?.template,
      questionCount: extra?.questionCount,
      tasks: extra?.tasks,
    });
    const images = await generateGraphics(built);
    const stored = await storeGameAssets(gameId, origin, built.spec, images);
    const deployed = deployGame(gameId, origin);

    await repository.saveGenerated(gameId, {
      spec: stored.spec,
      template: stored.spec.template,
      gameUrl: deployed.gameUrl,
      thumbnailUrl: stored.thumbnailUrl,
      coverUrl: stored.coverUrl,
      assetUrls: stored.assetUrls,
    });
    console.info('Game ready', { gameId, template: stored.spec.template, source: stored.spec.source });
  } catch (error) {
    console.error('Game pipeline failed', { gameId, error });
    await repository
      .update(gameId, {
        status: 'failed',
        error: 'Game generation failed.',
      })
      .catch((updateError) => {
        console.error('Could not mark the game as failed', { gameId, updateError });
      });
  }
}
