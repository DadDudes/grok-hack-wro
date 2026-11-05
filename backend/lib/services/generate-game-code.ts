import { buildGameSpec, type BuiltGame } from '@/lib/agents/build-spec';
import type { SpecRequest } from '@/lib/game-spec/fallback';

/**
 * Pedagog + Projektant gry. Returns a game spec, not source code.
 * The Phaser templates in `public/phaser/runtime.js` are fixed.
 * With no XAI_API_KEY this is the deterministic local spec.
 */
export async function generateGameCode(input: SpecRequest): Promise<BuiltGame> {
  return buildGameSpec(input);
}
