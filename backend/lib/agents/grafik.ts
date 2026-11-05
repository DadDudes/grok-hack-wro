import type { ImageSlot } from '@/lib/game-spec/schema';

import { xaiConfigured, xaiImage, type GeneratedBytes } from './xai';

const aspect: Record<ImageSlot, '1:1' | '16:9'> = {
  character: '1:1',
  background: '16:9',
  item: '1:1',
  thumbnail: '1:1',
  cover: '16:9',
};

function childSafePrompt(subject: string): string {
  return [
    "A single illustration for a children's educational game.",
    'Bright, friendly, simple shapes.',
    'No text, no letters, no numbers, no watermark, no logo.',
    'No violence, no weapons, no scary content, no romance.',
    `Subject: ${subject}`,
  ].join(' ');
}

/**
 * Grafik calls Grok Imagine once per slot. A failed slot is omitted.
 * The template draws shapes when a URL is missing.
 */
export async function generateThemeImages(
  prompts: Record<ImageSlot, string> | null,
): Promise<Partial<Record<ImageSlot, GeneratedBytes>>> {
  if (!prompts || !xaiConfigured()) return {};
  const slots = Object.keys(prompts) as ImageSlot[];
  const results = await Promise.all(
    slots.map(async (slot) => {
      try {
        const image = await xaiImage(childSafePrompt(prompts[slot]), aspect[slot]);
        return [slot, image] as const;
      } catch (error) {
        console.error('Grafik skipped an image', { slot, error });
        return null;
      }
    }),
  );
  const images: Partial<Record<ImageSlot, GeneratedBytes>> = {};
  for (const result of results) {
    if (result) images[result[0]] = result[1];
  }
  return images;
}
