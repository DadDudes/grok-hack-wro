/** Absolute origin for gameUrl. PUBLIC_BASE_URL wins, then the request, then localhost. */
export function publicOrigin(request: Request): string {
  const configured = (process.env.PUBLIC_BASE_URL || process.env.GAME_PUBLIC_URL_BASE || '')
    .trim()
    .replace(/\/$/, '');
  if (configured) return configured;

  const hostHeader = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const protoHeader = request.headers.get('x-forwarded-proto') ?? 'http';
  const host = hostHeader?.split(',')[0]?.trim();
  const proto = protoHeader.split(',')[0]?.trim() || 'http';
  if (host) return `${proto}://${host}`;
  return 'http://localhost:3001';
}

export function playUrl(origin: string, gameId: string): string {
  return `${origin.replace(/\/$/, '')}/play/${gameId}`;
}
