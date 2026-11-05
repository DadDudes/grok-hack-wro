const TRAILING_SLASHES = /\/+$/;

export function requestOrigin(request: Request): string {
  const configured = (process.env.PUBLIC_BASE_URL || process.env.GAME_PUBLIC_URL_BASE || '')
    .trim()
    .replace(TRAILING_SLASHES, '');
  if (configured) return configured;

  const hostHeader = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const protoHeader = request.headers.get('x-forwarded-proto') ?? 'http';
  const host = hostHeader?.split(',')[0]?.trim();
  const proto = protoHeader.split(',')[0]?.trim() || 'http';
  if (host) return `${proto}://${host}`;
  return 'http://127.0.0.1:3001';
}
