import { generateThemeImages } from '@/lib/agents/grafik';
import type { BuiltGame } from '@/lib/agents/build-spec';
import type { StoredImage } from '@/lib/assets/image-store';
import { cardPng } from '@/lib/images/solid-png';
import type { ImageSlot } from '@/lib/game-spec/schema';

/**
 * Grafik. Real images when the image model is configured.
 * Thumbnail and cover always exist: a drawn card stands in when Imagine is skipped or a slot fails.
 * Character, background, and item stay absent so the template can draw shapes.
 */
export async function generateGraphics(built: BuiltGame): Promise<StoredImage[]> {
  const generated = await generateThemeImages(built.imagePrompts);
  const images: StoredImage[] = [];
  const slots: ImageSlot[] = ['character', 'background', 'item', 'thumbnail', 'cover'];

  for (const name of slots) {
    const image = generated[name];
    if (image) {
      images.push({ name, bytes: image.bytes, contentType: image.contentType });
    }
  }

  const palette = built.spec.theme.palette;
  if (!generated.thumbnail) {
    images.push({ name: 'thumbnail', bytes: cardPng(palette, false), contentType: 'image/png' });
  }
  if (!generated.cover) {
    images.push({ name: 'cover', bytes: cardPng(palette, true), contentType: 'image/png' });
  }
  return images;
}
