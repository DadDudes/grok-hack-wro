import 'server-only';

export type XaiErrorKind =
  | 'not_configured'
  | 'rejected'
  | 'rate_limited'
  | 'bad_request'
  | 'unavailable'
  | 'timeout'
  | 'network'
  | 'invalid_output'
  | 'declined';

const SAFE_MESSAGES: Record<XaiErrorKind, string> = {
  not_configured: 'The AI service is not set up on this server.',
  rejected: 'The AI service refused our credentials.',
  rate_limited: 'The AI service is busy. Try again in a moment.',
  bad_request: 'The AI service could not read the request.',
  unavailable: 'The AI service is having trouble. Try again in a moment.',
  timeout: 'The AI service took too long to answer.',
  network: 'Could not reach the AI service.',
  invalid_output: 'The AI answer was not usable. Try again.',
  declined: 'The AI could not help with that idea. Try a different one.',
};

const ROUTE_STATUS: Record<XaiErrorKind, number> = {
  not_configured: 503,
  rejected: 502,
  rate_limited: 503,
  bad_request: 502,
  unavailable: 502,
  timeout: 504,
  network: 502,
  invalid_output: 502,
  declined: 422,
};

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR = 500;

export class XaiError extends Error {
  readonly kind: XaiErrorKind;
  readonly upstreamStatus: number | null;

  constructor(kind: XaiErrorKind, detail: string, upstreamStatus: number | null = null) {
    super(detail);
    this.name = 'XaiError';
    this.kind = kind;
    this.upstreamStatus = upstreamStatus;
  }

  get safeMessage(): string {
    return SAFE_MESSAGES[this.kind];
  }

  get routeStatus(): number {
    return ROUTE_STATUS[this.kind];
  }
}

export function errorKindForStatus(status: number): XaiErrorKind {
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) {
    return 'rejected';
  }

  if (status === HTTP_TOO_MANY_REQUESTS) {
    return 'rate_limited';
  }

  if (status >= HTTP_SERVER_ERROR) {
    return 'unavailable';
  }

  return 'bad_request';
}
