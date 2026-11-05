import { agentErrorResponse, agentResponse, parseJsonBody } from '@/app/api/_lib/http';
import { createTaskPlan } from '@/lib/agents/prof';
import { goalSchema } from '@/lib/agents/schemas';

export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request, goalSchema);

  if (!body.ok) {
    return body.response;
  }

  try {
    const result = await createTaskPlan(body.data);
    return agentResponse(result);
  } catch (error) {
    return agentErrorResponse('prof', error);
  }
}
