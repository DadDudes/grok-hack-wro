const API_BASE = 'https://api.x.ai/v1';

type JsonSchema = Record<string, unknown>;

export function xaiConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export function textModel(): string {
  return process.env.XAI_MODEL?.trim() || 'grok-4.7';
}

export function imageModel(): string {
  return process.env.XAI_IMAGE_MODEL?.trim() || 'grok-imagine-image';
}

function authHeaders(): Headers {
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) throw new Error('XAI_API_KEY is not set.');
  return new Headers({
    authorization: `Bearer ${key}`,
    'content-type': 'application/json',
  });
}

async function readError(response: Response): Promise<string> {
  const text = await response.text();
  return text.replace(/\s+/g, ' ').slice(0, 400);
}

function parseContent(content: unknown): unknown {
  if (typeof content !== 'string' || content.trim() === '') {
    throw new Error('xAI chat returned empty content.');
  }
  const trimmed = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  return JSON.parse(trimmed) as unknown;
}

/**
 * Chat completions with structured output. One retry without `reasoning_effort`
 * if the gateway rejects that field. The API key stays in the header, never in the body.
 */
export async function xaiChatJson(options: {
  name: string;
  schema: JsonSchema;
  system: string;
  user: string;
  timeoutMs?: number;
}): Promise<unknown> {
  const timeoutMs = options.timeoutMs ?? 50_000;
  const body: Record<string, unknown> = {
    model: textModel(),
    messages: [
      { role: 'system', content: options.system },
      { role: 'user', content: options.user },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: options.name,
        strict: true,
        schema: options.schema,
      },
    },
  };

  const reasoning = process.env.XAI_REASONING_EFFORT?.trim() || 'low';
  let response = await postChat({ ...body, reasoning_effort: reasoning }, timeoutMs);
  if (response.status === 400) {
    response = await postChat(body, timeoutMs);
  }
  if (!response.ok) {
    throw new Error(`xAI chat failed (${response.status}): ${await readError(response)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown; refusal?: string | null } }>;
  };
  const message = payload.choices?.[0]?.message;
  if (message?.refusal) {
    throw new Error('xAI chat refused the request.');
  }
  return parseContent(message?.content);
}

async function postChat(body: Record<string, unknown>, timeoutMs: number): Promise<Response> {
  return fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export type GeneratedBytes = {
  bytes: Uint8Array;
  contentType: string;
};

/**
 * POST /v1/images/generations. Prefers `b64_json`. Falls back to a temporary URL.
 * Drops `aspect_ratio` and retries once if the model rejects it.
 */
export async function xaiImage(prompt: string, aspectRatio: '1:1' | '16:9'): Promise<GeneratedBytes> {
  const base = {
    model: imageModel(),
    prompt: prompt.slice(0, 1000),
    response_format: 'b64_json',
    n: 1,
  };
  let response = await postImage({ ...base, aspect_ratio: aspectRatio });
  if (response.status === 400) {
    response = await postImage(base);
  }
  if (!response.ok) {
    throw new Error(`xAI image failed (${response.status}): ${await readError(response)}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string | null; url?: string | null; mime_type?: string | null }>;
  };
  const item = payload.data?.[0];
  if (item?.b64_json) {
    const bytes = Uint8Array.from(Buffer.from(item.b64_json, 'base64'));
    return { bytes, contentType: sniffImage(bytes, item.mime_type) };
  }
  if (item?.url) {
    const downloaded = await fetch(item.url, { signal: AbortSignal.timeout(20_000) });
    if (!downloaded.ok) {
      throw new Error(`xAI image URL failed (${downloaded.status}).`);
    }
    const bytes = new Uint8Array(await downloaded.arrayBuffer());
    return { bytes, contentType: sniffImage(bytes, item.mime_type ?? downloaded.headers.get('content-type')) };
  }
  throw new Error('xAI image response had no bytes.');
}

async function postImage(body: Record<string, unknown>): Promise<Response> {
  return fetch(`${API_BASE}/images/generations`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(40_000),
  });
}

export function sniffImage(bytes: Uint8Array, hinted: string | null | undefined): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57) return 'image/webp';
  const hint = hinted?.split(';')[0]?.trim().toLowerCase();
  if (hint === 'image/png' || hint === 'image/jpeg' || hint === 'image/webp') return hint;
  return 'image/png';
}
