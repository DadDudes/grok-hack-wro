import type { Game, GameStatus, GameTemplate } from '@grok-hack/api-contract';
import type { SupabaseClient } from '@supabase/supabase-js';

import { gameSpecSchema, type GameSpec } from '@/lib/game-spec/schema';

import type { GamePatch, GameRepository, NewGame, SavedGeneration, StoredResult } from './repository';

type GameRow = {
  id: string;
  parent_prompt: string;
  child_prompt: string;
  child_age: number | null;
  language: string | null;
  status: GameStatus;
  template: string | null;
  game_url: string | null;
  thumbnail_url: string | null;
  cover_url: string | null;
  assets: unknown;
  spec: unknown;
  error: string | null;
  created_at: string;
  updated_at: string;
};

function assetUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function templateOf(value: string | null): GameTemplate | null {
  if (value === 'collect' || value === 'runner' || value === 'quiz') return value;
  return null;
}

function toIso(value: string): string {
  return new Date(value).toISOString();
}

function rowToGame(row: GameRow): Game {
  return {
    id: row.id,
    parentPrompt: row.parent_prompt,
    childPrompt: row.child_prompt,
    childAge: row.child_age,
    language: row.language,
    status: row.status,
    template: templateOf(row.template),
    gameUrl: row.game_url,
    graphics: {
      thumbnailUrl: row.thumbnail_url,
      coverUrl: row.cover_url,
      assetUrls: assetUrls(row.assets),
    },
    error: row.error,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export class SupabaseGameRepository implements GameRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async insert(input: NewGame): Promise<Game> {
    const { data, error } = await this.client
      .from('games')
      .insert({
        parent_prompt: input.parentPrompt,
        child_prompt: input.childPrompt,
        child_age: input.childAge,
        language: input.language,
        status: 'queued',
        assets: [],
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }
    return rowToGame(data as GameRow);
  }

  async update(id: string, patch: GamePatch): Promise<Game> {
    const row: Record<string, unknown> = {};
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.gameUrl !== undefined) row.game_url = patch.gameUrl;
    if (patch.thumbnailUrl !== undefined) row.thumbnail_url = patch.thumbnailUrl;
    if (patch.coverUrl !== undefined) row.cover_url = patch.coverUrl;
    if (patch.assetUrls !== undefined) row.assets = patch.assetUrls;
    if (patch.error !== undefined) row.error = patch.error;
    if (patch.template !== undefined) row.template = patch.template;

    const { data, error } = await this.client
      .from('games')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Supabase update failed: ${error.message}`);
    }
    return rowToGame(data as GameRow);
  }

  async findById(id: string): Promise<Game | null> {
    const { data, error } = await this.client.from('games').select('*').eq('id', id).maybeSingle();

    if (error) {
      throw new Error(`Supabase read failed: ${error.message}`);
    }
    return data ? rowToGame(data as GameRow) : null;
  }

  async saveGenerated(id: string, saved: SavedGeneration): Promise<Game> {
    const spec = gameSpecSchema.parse(saved.spec);
    const { data, error } = await this.client
      .from('games')
      .update({
        status: 'ready',
        template: saved.template,
        game_url: saved.gameUrl,
        thumbnail_url: saved.thumbnailUrl,
        cover_url: saved.coverUrl,
        assets: saved.assetUrls,
        spec,
        error: null,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Supabase save failed: ${error.message}`);
    }
    return rowToGame(data as GameRow);
  }

  async getSpec(id: string): Promise<GameSpec | null> {
    const { data, error } = await this.client.from('games').select('spec').eq('id', id).maybeSingle();
    if (error) {
      throw new Error(`Supabase spec read failed: ${error.message}`);
    }
    const row = data as { spec: unknown } | null;
    if (!row?.spec) return null;
    const parsed = gameSpecSchema.safeParse(row.spec);
    if (!parsed.success) {
      console.error('Stored game spec failed validation', { gameId: id });
      return null;
    }
    return parsed.data;
  }

  async saveResult(id: string, result: StoredResult): Promise<boolean> {
    const { data, error } = await this.client
      .from('games')
      .update({ last_result: result })
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) {
      throw new Error(`Supabase result save failed: ${error.message}`);
    }
    return Boolean(data);
  }
}
