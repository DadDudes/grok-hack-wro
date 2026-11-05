import { agentErrorResponse, agentResponse, parseJsonBody } from '@/app/api/_lib/http';
import { giveHint } from '@/lib/agents/robo';
import { hintRequestSchema } from '@/lib/agents/schemas';

export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request, hintRequestSchema);

  if (!body.ok) {
    return body.response;
  }

  try {
    const result = await giveHint(body.data);
    return agentResponse(result);
  } catch (error) {
    return agentErrorResponse('robo', error);
  }
}
