import { zodErrorDetails, type ApiErrorCode, type FieldError } from '@grok-hack/api-contract';
import type { ZodError } from 'zod';

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

function allowedOrigins(): string[] {
  const configured = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  return configured && configured.length > 0 ? configured : DEFAULT_ORIGINS;
}

export function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origins = allowedOrigins();
  const requestOrigin = request.headers.get('origin');

  if (origins.includes('*')) {
    headers.set('Access-Control-Allow-Origin', '*');
  } else if (requestOrigin && origins.includes(requestOrigin)) {
    headers.set('Access-Control-Allow-Origin', requestOrigin);
    headers.set('Vary', 'Origin');
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

export function json(request: Request, body: unknown, status = 200): Response {
  const headers = corsHeaders(request);
  headers.set('Cache-Control', 'no-store');
  return Response.json(body, { status, headers });
}

export function empty(request: Request, status = 204): Response {
  return new Response(null, { status, headers: corsHeaders(request) });
}

export function errorBody(
  code: ApiErrorCode,
  message: string,
  details?: FieldError[],
): { error: { code: ApiErrorCode; message: string; details?: FieldError[] } } {
  return details ? { error: { code, message, details } } : { error: { code, message } };
}

export function validationError(error: ZodError) {
  return errorBody('validation_error', 'Invalid request.', zodErrorDetails(error));
}
