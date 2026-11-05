import { parseJsonBody } from '@/app/api/_lib/http';
import { sseResponse } from '@/app/api/_lib/sse';
import { runBuild } from '@/lib/agents/build';
import { buildRequestSchema } from '@/lib/agents/schemas';
import { requestOrigin } from '@/lib/games-api/origin';
import type { BuildEvent } from '@/lib/flow/types';

export const maxDuration = 300;

const BUILD_FAILED_EVENT: BuildEvent = {
  type: 'failed',
  message: 'The build stopped unexpectedly. Try again.',
};

export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request, buildRequestSchema);

  if (!body.ok) {
    return body.response;
  }

  const buildRequest = body.data;
  const signal = request.signal;

  return sseResponse<BuildEvent>(
    (emit) => runBuild(buildRequest, emit, signal, requestOrigin(request)),
    BUILD_FAILED_EVENT,
  );
}
