import { playUrl } from '@/lib/public-origin';

/**
 * The playable URL is this app, not a Storage object.
 * Supabase Storage serves HTML as text/plain with a sandbox CSP, so a game cannot run from the bucket.
 */
export function deployGame(gameId: string, origin: string): { gameUrl: string } {
  return { gameUrl: playUrl(origin, gameId) };
}
