import 'server-only';

import { z } from 'zod';

import { postToXai } from './client';
import { getXaiConfig } from './config';
import { XaiError } from './errors';
import { logUsage, type XaiUsage } from './usage';

const STT_PATH = '/stt';
const STT_TIMEOUT_MS = 30_000;
const STT_USD_PER_HOUR = 0.1;
const SECONDS_PER_HOUR = 3600;

const sttResponseSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
  duration: z.number().optional(),
});

export type SpeechRequest = {
  audio: Blob;
  filename: string;
  language?: string;
  signal?: AbortSignal;
};

export type SpeechResult = {
  text: string;
  language: string | null;
  durationSeconds: number | null;
  usage: XaiUsage;
};

function costForDuration(durationSeconds: number | null): number | null {
  if (durationSeconds === null) {
    return null;
  }

  return (durationSeconds / SECONDS_PER_HOUR) * STT_USD_PER_HOUR;
}

export async function transcribeSpeech(request: SpeechRequest): Promise<SpeechResult> {
  const config = getXaiConfig();
  const form = new FormData();
  form.append('model', config.sttModel);

  if (request.language !== undefined) {
    form.append('language', request.language);
  }

  form.append('file', request.audio, request.filename);

  const raw = await postToXai({
    path: STT_PATH,
    body: form,
    timeoutMs: STT_TIMEOUT_MS,
    signal: request.signal,
  });

  const parsed = sttResponseSchema.safeParse(raw.data);

  if (!parsed.success) {
    throw new XaiError('invalid_output', `${STT_PATH} returned an unexpected shape`);
  }

  const durationSeconds = parsed.data.duration ?? null;
  const usage: XaiUsage = {
    agent: 'voice',
    endpoint: STT_PATH,
    model: config.sttModel,
    latencyMs: raw.latencyMs,
    inputTokens: 0,
    cachedTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    costUsd: costForDuration(durationSeconds),
  };
  logUsage(usage);

  return {
    text: parsed.data.text.trim(),
    language: parsed.data.language ?? null,
    durationSeconds,
    usage,
  };
}
