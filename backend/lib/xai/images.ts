import 'server-only';

import { z } from 'zod';

import { postToXai } from './client';
import { getXaiConfig } from './config';
import { XaiError } from './errors';
import { costFromTicks, logUsage, type XaiAgent, type XaiUsage } from './usage';

const IMAGES_PATH = '/images/generations';
const IMAGE_TIMEOUT_MS = 60_000;
const IMAGE_RESOLUTION = '1k';
const IMAGES_PER_REQUEST = 1;
const DEFAULT_IMAGE_MIME_TYPE = 'image/jpeg';

export type ImageAspectRatio = '1:1' | '4:3' | '3:4' | '16:9';

const imageResponseSchema = z.object({
  data: z
    .array(
      z.object({
        b64_json: z.string().nullable().optional(),
        mime_type: z.string().nullable().optional(),
      }),
    )
    .min(1),
  usage: z
    .object({
      cost_in_usd_ticks: z.number().nullable().optional(),
      input_tokens: z.number().nullable().optional(),
      output_tokens: z.number().nullable().optional(),
    })
    .optional(),
});

export type ImageRequest = {
  agent: XaiAgent;
  prompt: string;
  aspectRatio: ImageAspectRatio;
};

export type GeneratedImage = {
  bytes: Uint8Array<ArrayBuffer>;
  mimeType: string;
  usage: XaiUsage;
};

export async function generateImage(request: ImageRequest): Promise<GeneratedImage> {
  const config = getXaiConfig();
  const body = JSON.stringify({
    model: config.imageModel,
    prompt: request.prompt,
    n: IMAGES_PER_REQUEST,
    aspect_ratio: request.aspectRatio,
    resolution: IMAGE_RESOLUTION,
    response_format: 'b64_json',
  });

  const raw = await postToXai({ path: IMAGES_PATH, body, timeoutMs: IMAGE_TIMEOUT_MS });
  const parsed = imageResponseSchema.safeParse(raw.data);

  if (!parsed.success) {
    throw new XaiError('invalid_output', `${IMAGES_PATH} returned an unexpected shape`);
  }

  const usage: XaiUsage = {
    agent: request.agent,
    endpoint: IMAGES_PATH,
    model: config.imageModel,
    latencyMs: raw.latencyMs,
    inputTokens: parsed.data.usage?.input_tokens ?? 0,
    cachedTokens: 0,
    outputTokens: parsed.data.usage?.output_tokens ?? 0,
    reasoningTokens: 0,
    costUsd: costFromTicks(parsed.data.usage?.cost_in_usd_ticks),
  };
  logUsage(usage);

  const image = parsed.data.data[0];
  const base64 = image.b64_json;

  if (!base64) {
    throw new XaiError('invalid_output', `${IMAGES_PATH} returned no image data`);
  }

  const bytes = new Uint8Array(Buffer.from(base64, 'base64'));
  const mimeType = image.mime_type ?? DEFAULT_IMAGE_MIME_TYPE;
  return { bytes, mimeType, usage };
}
