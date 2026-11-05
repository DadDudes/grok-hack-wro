import 'server-only';

import { XaiError } from './errors';

const XAI_BASE_URL = 'https://api.x.ai/v1';
const DEFAULT_TEXT_MODEL = 'grok-4.7';
const FALLBACK_TEXT_MODEL = 'grok-4.6';
const DEFAULT_IMAGE_MODEL = 'grok-imagine-image-2.0';
const DEFAULT_STT_MODEL = 'grok-voice-transcribe-2.0';

export type XaiConfig = {
  baseUrl: string;
  apiKey: string;
  textModel: string;
  fallbackTextModel: string | null;
  imageModel: string;
  sttModel: string;
};

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();

  if (!value) {
    return null;
  }

  return value;
}

export function xaiIsConfigured(): boolean {
  return readEnv('XAI_API_KEY') !== null;
}

export function getXaiConfig(): XaiConfig {
  const apiKey = readEnv('XAI_API_KEY');

  if (apiKey === null) {
    throw new XaiError('not_configured', 'XAI_API_KEY is not set');
  }

  const textModel = readEnv('XAI_MODEL') ?? DEFAULT_TEXT_MODEL;
  const fallbackTextModel = textModel === FALLBACK_TEXT_MODEL ? null : FALLBACK_TEXT_MODEL;
  const imageModel = readEnv('XAI_IMAGE_MODEL') ?? DEFAULT_IMAGE_MODEL;
  const sttModel = readEnv('XAI_STT_MODEL') ?? DEFAULT_STT_MODEL;

  return {
    baseUrl: XAI_BASE_URL,
    apiKey,
    textModel,
    fallbackTextModel,
    imageModel,
    sttModel,
  };
}
