import type { Game } from '@grok-hack/api-contract';

import type { GamePatch, GameRepository, NewGame } from './repository';

/**
 * Process-local stand-in used only when Supabase env vars are absent.
 * `next dev` is one process, so POST then GET works on localhost.
 * A deployed function must use Supabase. This map is not shared across instances.
 */
const records = new Map<string, Game>();

function stamp(game: Game, patch: GamePatch): Game {
  return {
    ...game,
    status: patch.status ?? game.status,
    gameUrl: patch.gameUrl === undefined ? game.gameUrl : patch.gameUrl,
    error: patch.error === undefined ? game.error : patch.error,
    graphics: {
      thumbnailUrl:
        patch.thumbnailUrl === undefined ? game.graphics.thumbnailUrl : patch.thumbnailUrl,
      coverUrl: patch.coverUrl === undefined ? game.graphics.coverUrl : patch.coverUrl,
      assetUrls: patch.assetUrls === undefined ? game.graphics.assetUrls : patch.assetUrls,
    },
    updatedAt: new Date().toISOString(),
  };
}

export const memoryGameRepository: GameRepository = {
  async insert(input: NewGame): Promise<Game> {
    const now = new Date().toISOString();
    const game: Game = {
      id: crypto.randomUUID(),
      parentPrompt: input.parentPrompt,
      childPrompt: input.childPrompt,
      childAge: input.childAge,
      language: input.language,
      status: 'queued',
      gameUrl: null,
      graphics: {
        thumbnailUrl: null,
        coverUrl: null,
        assetUrls: [],
      },
      error: null,
      createdAt: now,
      updatedAt: now,
    };
    records.set(game.id, game);
    return game;
  },

  async update(id: string, patch: GamePatch): Promise<Game> {
    const current = records.get(id);
    if (!current) {
      throw new Error(`Game ${id} is not in the memory store.`);
    }
    const next = stamp(current, patch);
    records.set(id, next);
    return next;
  },

  async findById(id: string): Promise<Game | null> {
    return records.get(id) ?? null;
  },
};
