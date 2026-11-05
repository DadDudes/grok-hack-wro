import { healthResponseSchema, type HealthResponse } from '@grok-hack/api-contract';

import { empty, json } from '@/lib/http';
import { storageMode } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export function OPTIONS(request: Request) {
  return empty(request);
}

export function GET(request: Request) {
  const body: HealthResponse = {
    ok: true,
    service: 'games-api',
    storage: storageMode(),
  };
  return json(request, healthResponseSchema.parse(body));
}
