import type { Game, GameStatus } from '@grok-hack/api-contract';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { GamePatch, GameRepository, NewGame } from './repository';

type GameRow = {
  id: string;
  parent_prompt: string;
  child_prompt: string;
  child_age: number | null;
  language: string | null;
  status: GameStatus;
  game_url: string | null;
  thumbnail_url: string | null;
  cover_url: string | null;
  assets: unknown;
  error: string | null;
  created_at: string;
  updated_at: string;
};

function assetUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
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
  constructor(private readonly client: SupabaseClient) {}

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
}
