import { getSupabaseAdmin } from '@/lib/supabase/client';

import { memoryGameRepository } from './memory-repository';
import type { GameRepository } from './repository';
import { SupabaseGameRepository } from './supabase-repository';

let warned = false;

export function getGameRepository(): GameRepository {
  if (process.env.GAME_STORE === 'memory') return memoryGameRepository;
  const client = getSupabaseAdmin();
  if (!client) {
    if (!warned) {
      warned = true;
      console.info(
        'Supabase is not configured. Game records live in this process only. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to persist them.',
      );
    }
    return memoryGameRepository;
  }
  return new SupabaseGameRepository(client);
}
