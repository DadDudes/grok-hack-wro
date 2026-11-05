import { empty, json } from '@/lib/http';

export const dynamic = 'force-dynamic';

export function OPTIONS(request: Request) {
  return empty(request);
}

export function GET(request: Request) {
  return json(request, {
    service: 'games-api',
    health: '/api/health',
    games: '/api/games',
    contract: 'See docs/api-contract.md in the repository.',
  });
}
