import 'server-only';

import { getXaiConfig } from './config';
import { errorKindForStatus, XaiError } from './errors';
import { errorReason, isTimeoutError, timeoutSignal } from './transport';

const MAX_LOGGED_BODY_CHARS = 400;

export type XaiPostRequest = {
  path: string;
  body: string | FormData;
  timeoutMs: number;
  signal?: AbortSignal;
};

export type XaiPostResult = {
  data: unknown;
  latencyMs: number;
};

function toTransportError(path: string, error: unknown): XaiError {
  if (isTimeoutError(error)) {
    return new XaiError('timeout', `${path} timed out`);
  }

  const reason = errorReason(error);
  return new XaiError('network', `${path} failed: ${reason}`);
}

function parseJson(path: string, text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const preview = text.slice(0, MAX_LOGGED_BODY_CHARS);
    throw new XaiError('invalid_output', `${path} returned non-JSON: ${preview}`);
  }
}

export async function postToXai(request: XaiPostRequest): Promise<XaiPostResult> {
  const config = getXaiConfig();
  const url = `${config.baseUrl}${request.path}`;
  const headers = new Headers({ authorization: `Bearer ${config.apiKey}` });

  if (typeof request.body === 'string') {
    headers.set('content-type', 'application/json');
  }

  const signal = timeoutSignal(request.timeoutMs, request.signal);
  const startedAt = performance.now();
  let text: string;
  let status: number;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: request.body,
      signal,
      cache: 'no-store',
    });
    status = response.status;
    text = await response.text();
  } catch (error) {
    throw toTransportError(request.path, error);
  }

  const latencyMs = Math.round(performance.now() - startedAt);

  if (status < 200 || status >= 300) {
    const kind = errorKindForStatus(status);
    const preview = text.slice(0, MAX_LOGGED_BODY_CHARS);
    throw new XaiError(kind, `${request.path} returned ${status}: ${preview}`, status);
  }

  const data = parseJson(request.path, text);
  return { data, latencyMs };
}
