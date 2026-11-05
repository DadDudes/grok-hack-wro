import type { Game, GameStatus } from '@grok-hack/api-contract';

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
};

export interface GameRepository {
  insert(input: NewGame): Promise<Game>;
  update(id: string, patch: GamePatch): Promise<Game>;
  findById(id: string): Promise<Game | null>;
}
