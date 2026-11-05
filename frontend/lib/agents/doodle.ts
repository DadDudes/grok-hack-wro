import 'server-only';

import { createHash } from 'node:crypto';

import type {
  GameOption,
  GameTemplate,
  OptionPreviewRequest,
  OptionPreviewResponse,
} from '@/lib/flow/types';
import { generateImage } from '@/lib/xai/images';
import { errorReason } from '@/lib/xai/transport';
import type { XaiUsage } from '@/lib/xai/usage';

import type { AgentResult } from './prompt';
import { IMAGE_VISUAL_STYLE } from './visual-style';

const SCENE_PREFIX =
  'Cute flat 2D game scene for kids, sticker style, thick dark outlines, flat fills, ' +
  'no gradients, bright colors, no text, no letters, no numbers:';

const SINGLE_SCENE_RULE =
  'One single scene that fills the whole frame, with the world as its background. ' +
  'No checkerboard, no transparent background, no sticker sheet, no panels, no borders, ' +
  'no user interface.';

const TEMPLATE_MECHANICS: Record<GameTemplate, string> = {
  collect: 'Gameplay shown: the hero moves through the world catching floating collectible items.',
  runner: 'Gameplay shown: the hero runs along a path and leaps through one of several big gates.',
  quiz_battle:
    'Gameplay shown: the hero stands facing a big friendly boss character, both smiling, ' +
    'ready for a quiz duel.',
};

export const DOODLE_IMAGE_PATH = '/api/agents/doodle';
export const THEME_KEY_PATTERN = /^[a-f0-9]{16}$/;

const THEME_KEY_LENGTH = 16;
const MAX_CACHED_IMAGES = 50;
const SCENE_ASPECT_RATIO = '4:3';
const NON_WORD_CHARS = /[^\p{L}\p{N}]+/gu;
const CACHE_SYMBOL = Symbol.for('edubotgames.doodle.cache');
const STYLE_FINGERPRINT = [SCENE_PREFIX, IMAGE_VISUAL_STYLE, SINGLE_SCENE_RULE].join('\n');

export type CachedImage = {
  bytes: Uint8Array<ArrayBuffer>;
  mimeType: string;
};

type DoodleCache = {
  images: Map<string, CachedImage>;
  pending: Map<string, Promise<CachedImage>>;
};

type GlobalWithCache = typeof globalThis & { [CACHE_SYMBOL]?: DoodleCache };

export type SceneRequest = {
  kidIdea: string;
  topic: string;
  option: GameOption;
};

function getCache(): DoodleCache {
  const store = globalThis as GlobalWithCache;
  const existing = store[CACHE_SYMBOL];

  if (existing !== undefined) {
    return existing;
  }

  const created: DoodleCache = { images: new Map(), pending: new Map() };
  store[CACHE_SYMBOL] = created;
  return created;
}

function sceneKey(kidIdea: string, template: GameTemplate): string {
  const lowerCase = kidIdea.normalize('NFKC').toLowerCase();
  const theme = lowerCase.replace(NON_WORD_CHARS, ' ').trim();
  const hash = createHash('sha256');
  hash.update(STYLE_FINGERPRINT);
  hash.update(template);
  hash.update(theme);
  const digest = hash.digest('hex');
  return digest.slice(0, THEME_KEY_LENGTH);
}

function scenePrompt(request: SceneRequest): string {
  const mechanic = TEMPLATE_MECHANICS[request.option.template];

  return [
    SCENE_PREFIX,
    IMAGE_VISUAL_STYLE,
    `The world and its characters come from this kid's idea: ${request.kidIdea}.`,
    'The hero is a cute character from that world.',
    mechanic,
    `The items hint at the learning topic (${request.topic}) with shapes only.`,
    SINGLE_SCENE_RULE,
  ].join(' ');
}

function remember(cache: DoodleCache, key: string, image: CachedImage): void {
  if (cache.images.size >= MAX_CACHED_IMAGES) {
    const oldestKey = cache.images.keys().next().value;

    if (oldestKey !== undefined) {
      cache.images.delete(oldestKey);
    }
  }

  cache.images.set(key, image);
}

async function drawAndCache(
  cache: DoodleCache,
  key: string,
  prompt: string,
  usage: XaiUsage[],
): Promise<CachedImage> {
  const generated = await generateImage({
    agent: 'doodle',
    prompt,
    aspectRatio: SCENE_ASPECT_RATIO,
  });
  usage.push(generated.usage);

  const image: CachedImage = { bytes: generated.bytes, mimeType: generated.mimeType };
  remember(cache, key, image);
  return image;
}

function imageUrlFor(key: string): string {
  return `${DOODLE_IMAGE_PATH}/${key}`;
}

export function getCachedImage(key: string): CachedImage | null {
  const cache = getCache();
  return cache.images.get(key) ?? null;
}

export async function drawScene(request: SceneRequest): Promise<AgentResult<string>> {
  const cache = getCache();
  const key = sceneKey(request.kidIdea, request.option.template);
  const imageUrl = imageUrlFor(key);

  if (cache.images.has(key)) {
    return { data: imageUrl, usage: [] };
  }

  const pending = cache.pending.get(key);

  if (pending !== undefined) {
    await pending;
    return { data: imageUrl, usage: [] };
  }

  const usage: XaiUsage[] = [];
  const prompt = scenePrompt(request);
  const drawing = drawAndCache(cache, key, prompt, usage);
  cache.pending.set(key, drawing);

  try {
    await drawing;
  } finally {
    cache.pending.delete(key);
  }

  return { data: imageUrl, usage };
}

export async function drawOptionScenes(
  request: OptionPreviewRequest,
): Promise<AgentResult<OptionPreviewResponse>> {
  const drawings = request.options.map((option) => {
    const scene: SceneRequest = { kidIdea: request.kidIdea, topic: request.topic, option };
    return drawScene(scene);
  });
  const outcomes = await Promise.allSettled(drawings);

  const imageUrls: Array<string | null> = [];
  const usage: XaiUsage[] = [];

  for (const [index, outcome] of outcomes.entries()) {
    if (outcome.status === 'fulfilled') {
      imageUrls.push(outcome.value.data);
      usage.push(...outcome.value.usage);
      continue;
    }

    const reason = errorReason(outcome.reason);
    console.error(`[doodle] preview for option ${index + 1} failed: ${reason}`);
    imageUrls.push(null);
  }

  return { data: { imageUrls }, usage };
}
