import 'server-only';

import {
  apiPaths,
  createGameRequestSchema,
  gameSchema,
  type CreateGameRequest,
  type Game,
} from '@grok-hack/api-contract';

import { errorReason, isTimeoutError, timeoutSignal, wait } from '@/lib/xai/transport';

const DEFAULT_API_BASE_URL = 'http://localhost:3001';
const CREATE_TIMEOUT_MS = 120_000;
const GET_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 2_000;
const READY_TIMEOUT_MS = 180_000;
const MAX_LOGGED_BODY_CHARS = 400;
const TRAILING_SLASHES = /\/+$/;

export type GamesApiErrorKind = 'invalid_request' | 'unreachable' | 'rejected' | 'timeout';

const SAFE_MESSAGES: Record<GamesApiErrorKind, string> = {
  invalid_request: 'The game request did not fit the game engine.',
  unreachable: 'Could not reach the game engine.',
  rejected: 'The game engine could not create the game.',
  timeout: 'The game engine took too long.',
};

export class GamesApiError extends Error {
  readonly kind: GamesApiErrorKind;

  constructor(kind: GamesApiErrorKind, detail: string) {
    super(detail);
    this.name = 'GamesApiError';
    this.kind = kind;
  }

  get safeMessage(): string {
    return SAFE_MESSAGES[this.kind];
  }
}

function baseUrl(): string {
  const configured = process.env.API_BASE_URL?.trim();
  const url = configured ? configured : DEFAULT_API_BASE_URL;
  return url.replace(TRAILING_SLASHES, '');
}

async function requestGame(path: string, init: RequestInit, timeoutMs: number): Promise<Game> {
  const base = baseUrl();
  const url = `${base}${path}`;
  const signal = timeoutSignal(timeoutMs, init.signal);
  let status: number;
  let text: string;

  try {
    const response = await fetch(url, { ...init, signal, cache: 'no-store' });
    status = response.status;
    text = await response.text();
  } catch (error) {
    const reason = errorReason(error);
    const kind: GamesApiErrorKind = isTimeoutError(error) ? 'timeout' : 'unreachable';
    throw new GamesApiError(kind, `${path} failed: ${reason}`);
  }

  if (status < 200 || status >= 300) {
    const preview = text.slice(0, MAX_LOGGED_BODY_CHARS);
    throw new GamesApiError('rejected', `${path} returned ${status}: ${preview}`);
  }

  let json: unknown;

  try {
    json = JSON.parse(text) as unknown;
  } catch {
    throw new GamesApiError('rejected', `${path} returned non-JSON`);
  }

  const parsed = gameSchema.safeParse(json);

  if (!parsed.success) {
    throw new GamesApiError('rejected', `${path} returned an unexpected game shape`);
  }

  return parsed.data;
}

export async function createGame(input: CreateGameRequest, signal?: AbortSignal): Promise<Game> {
  const parsed = createGameRequestSchema.safeParse(input);

  if (!parsed.success) {
    const issues = JSON.stringify(parsed.error.issues).slice(0, MAX_LOGGED_BODY_CHARS);
    throw new GamesApiError('invalid_request', `create game request is invalid: ${issues}`);
  }

  const body = JSON.stringify(parsed.data);
  const init: RequestInit = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    signal,
  };

  return requestGame(apiPaths.games, init, CREATE_TIMEOUT_MS);
}

export async function getGame(id: string, signal?: AbortSignal): Promise<Game> {
  const path = apiPaths.game(encodeURIComponent(id));
  const init: RequestInit = { method: 'GET', signal };
  return requestGame(path, init, GET_TIMEOUT_MS);
}

function isFinished(game: Game): boolean {
  return game.status === 'ready' || game.status === 'failed';
}

export async function waitForGame(game: Game, signal?: AbortSignal): Promise<Game> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let current = game;

  while (!isFinished(current)) {
    if (Date.now() > deadline) {
      throw new GamesApiError('timeout', `game ${game.id} was not ready in time`);
    }

    signal?.throwIfAborted();
    await wait(POLL_INTERVAL_MS);
    current = await getGame(game.id, signal);
  }

  return current;
}
