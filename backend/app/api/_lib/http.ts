import 'server-only';

import { zodErrorDetails, type FieldError } from '@grok-hack/api-contract';
import type { z } from 'zod';

import type { AgentResult } from '@/lib/agents/prompt';
import { XaiError, type XaiErrorKind } from '@/lib/xai/errors';
import { errorReason } from '@/lib/xai/transport';
import { formatUsageHeader, type XaiAgent } from '@/lib/xai/usage';

export type RouteErrorCode =
  | 'invalid_json'
  | 'invalid_form'
  | 'validation_error'
  | 'agent_error'
  | 'not_found'
  | 'internal_error';

type ErrorBody = {
  error: {
    code: RouteErrorCode;
    message: string;
    retryable: boolean;
    agent?: XaiAgent;
    details?: FieldError[];
  };
};

export type ParsedBody<T> = { ok: true; data: T } | { ok: false; response: Response };

const HTTP_BAD_REQUEST = 400;
const HTTP_SERVER_ERROR = 500;
const USAGE_HEADER = 'x-xai-usage';
const NO_STORE = 'no-store';
const INTERNAL_ERROR_MESSAGE = 'Something went wrong on our side. Try again.';

const RETRYABLE_KINDS: ReadonlySet<XaiErrorKind> = new Set([
  'rate_limited',
  'unavailable',
  'timeout',
  'network',
  'invalid_output',
]);

export function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('cache-control', NO_STORE);
  return Response.json(body, { status, headers: responseHeaders });
}

export function errorResponse(status: number, error: ErrorBody['error']): Response {
  const body: ErrorBody = { error };
  return jsonResponse(body, status);
}

export function validationErrorResponse(error: z.ZodError): Response {
  const details = zodErrorDetails(error);

  return errorResponse(HTTP_BAD_REQUEST, {
    code: 'validation_error',
    message: 'Invalid request.',
    retryable: false,
    details,
  });
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParsedBody<T>> {
  let json: unknown;

  try {
    json = (await request.json()) as unknown;
  } catch {
    const response = errorResponse(HTTP_BAD_REQUEST, {
      code: 'invalid_json',
      message: 'Body is not valid JSON.',
      retryable: false,
    });
    return { ok: false, response };
  }

  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    const response = validationErrorResponse(parsed.error);
    return { ok: false, response };
  }

  return { ok: true, data: parsed.data };
}

export function agentResponse<T>(result: AgentResult<T>): Response {
  const headers = new Headers();

  if (result.usage.length > 0) {
    const usage = formatUsageHeader(result.usage);
    headers.set(USAGE_HEADER, usage);
  }

  return jsonResponse(result.data, 200, headers);
}

export function agentErrorResponse(agent: XaiAgent, error: unknown): Response {
  const reason = errorReason(error);
  console.error(`[${agent}] failed: ${reason}`);

  if (error instanceof XaiError) {
    const retryable = RETRYABLE_KINDS.has(error.kind);

    return errorResponse(error.routeStatus, {
      code: 'agent_error',
      message: error.safeMessage,
      retryable,
      agent,
    });
  }

  return errorResponse(HTTP_SERVER_ERROR, {
    code: 'internal_error',
    message: INTERNAL_ERROR_MESSAGE,
    retryable: true,
    agent,
  });
}
