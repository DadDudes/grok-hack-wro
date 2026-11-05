import { agentErrorResponse, agentResponse, parseJsonBody } from '@/app/api/_lib/http';
import { writeReport } from '@/lib/agents/lens';
import { lensRequestSchema } from '@/lib/agents/schemas';

export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request, lensRequestSchema);

  if (!body.ok) {
    return body.response;
  }

  try {
    const result = await writeReport(body.data);
    return agentResponse(result);
  } catch (error) {
    return agentErrorResponse('lens', error);
  }
}
