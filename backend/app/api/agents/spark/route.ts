import { agentErrorResponse, agentResponse, parseJsonBody } from '@/app/api/_lib/http';
import { sparkRequestSchema } from '@/lib/agents/schemas';
import { suggestGameOptions } from '@/lib/agents/spark';

export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request, sparkRequestSchema);

  if (!body.ok) {
    return body.response;
  }

  try {
    const result = await suggestGameOptions(body.data);
    return agentResponse(result);
  } catch (error) {
    return agentErrorResponse('spark', error);
  }
}
