import { agentResponse, parseJsonBody } from '@/app/api/_lib/http';
import { drawOptionScenes } from '@/lib/agents/doodle';
import { optionPreviewRequestSchema } from '@/lib/agents/schemas';

export const maxDuration = 120;

export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request, optionPreviewRequestSchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await drawOptionScenes(body.data);
  return agentResponse(result);
}
