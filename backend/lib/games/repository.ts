import type { Game, GameStatus, GameTemplate } from '@grok-hack/api-contract';

import type { GameSpec } from '@/lib/game-spec/schema';

export type NewGame = {
  parentPrompt: string;
  childPrompt: string;
  childAge: number | null;
  language: string | null;
};

export type GamePatch = {
  status?: GameStatus;
  gameUrl?: string | null;
  thumbnailUrl?: string | null;
  coverUrl?: string | null;
  assetUrls?: string[];
  error?: string | null;
  template?: GameTemplate | null;
};

export type SavedGeneration = {
  spec: GameSpec;
  template: GameTemplate;
  gameUrl: string;
  thumbnailUrl: string | null;
  coverUrl: string | null;
  assetUrls: string[];
};

export type StoredResult = {
  score: number;
  total: number;
  correct: number;
  durationMs: number | null;
  receivedAt: string;
};

export interface GameRepository {
  insert(input: NewGame): Promise<Game>;
  update(id: string, patch: GamePatch): Promise<Game>;
  findById(id: string): Promise<Game | null>;
  saveGenerated(id: string, saved: SavedGeneration): Promise<Game>;
  getSpec(id: string): Promise<GameSpec | null>;
  /** Returns false when the game id is unknown. */
  saveResult(id: string, result: StoredResult): Promise<boolean>;
}
