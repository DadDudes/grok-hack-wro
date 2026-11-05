import type { Game } from '@grok-hack/api-contract';

import { gameSpecSchema, type GameSpec } from '@/lib/game-spec/schema';

import type { GamePatch, GameRepository, NewGame, SavedGeneration, StoredResult } from './repository';

/**
 * Process-local stand-in used only when Supabase env vars are absent,
 * or when GAME_STORE=memory. `next dev` is one process, so POST then GET works.
 * A deployed function must use Supabase. This map is not shared across instances.
 */
const records = new Map<string, Game>();
const specs = new Map<string, GameSpec>();
const results = new Map<string, StoredResult>();

function stamp(game: Game, patch: GamePatch): Game {
  return {
    ...game,
    status: patch.status ?? game.status,
    template: patch.template === undefined ? game.template : patch.template,
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
      template: null,
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

  async saveGenerated(id: string, saved: SavedGeneration): Promise<Game> {
    const spec = gameSpecSchema.parse(saved.spec);
    specs.set(id, spec);
    return this.update(id, {
      status: 'ready',
      template: saved.template,
      gameUrl: saved.gameUrl,
      thumbnailUrl: saved.thumbnailUrl,
      coverUrl: saved.coverUrl,
      assetUrls: saved.assetUrls,
      error: null,
    });
  },

  async getSpec(id: string): Promise<GameSpec | null> {
    return specs.get(id) ?? null;
  },

  async saveResult(id: string, result: StoredResult): Promise<boolean> {
    if (!records.has(id)) return false;
    results.set(id, result);
    return true;
  },
};

/** Test helper. Not used by the request path. */
export function readStoredResult(id: string): StoredResult | null {
  return results.get(id) ?? null;
}
