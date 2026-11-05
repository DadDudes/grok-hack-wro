import { publishImage, publishSpecJson, type StoredImage } from '@/lib/assets/image-store';
import { emptyAssets } from '@/lib/game-spec/fallback';
import type { GameSpec, ImageSlot } from '@/lib/game-spec/schema';

import { playUrl } from '@/lib/public-origin';

export type StoredGame = {
  spec: GameSpec;
  gameUrl: string;
  thumbnailUrl: string | null;
  coverUrl: string | null;
  assetUrls: string[];
};

/**
 * Publishes images on this instance (and Supabase when configured) and points the spec
 * at same-origin `/play/{id}/assets/{name}` URLs. Phaser then does not depend on Storage CORS
 * or `Content-Disposition: attachment`.
 * Thumbnail and cover are not repeated in `assetUrls`.
 */
export async function storeGameAssets(
  gameId: string,
  origin: string,
  spec: GameSpec,
  images: StoredImage[],
): Promise<StoredGame> {
  const assets = emptyAssets();
  const assetUrls: string[] = [];
  const base = origin.replace(/\/$/, '');

  for (const image of images) {
    const published = await publishImage(gameId, image);
    if (!published) continue;
    const url = `${base}/play/${gameId}/assets/${image.name}`;
    assignAsset(assets, image.name, url);
    if (image.name !== 'thumbnail' && image.name !== 'cover') assetUrls.push(url);
  }

  const storedSpec: GameSpec = { ...spec, assets };
  const specUrl = await publishSpecJson(gameId, storedSpec);
  if (specUrl) assetUrls.push(specUrl);

  return {
    spec: storedSpec,
    gameUrl: playUrl(origin, gameId),
    thumbnailUrl: assets.thumbnailUrl,
    coverUrl: assets.coverUrl,
    assetUrls,
  };
}

function assignAsset(assets: GameSpec['assets'], name: ImageSlot, url: string): void {
  if (name === 'character') assets.characterUrl = url;
  if (name === 'background') assets.backgroundUrl = url;
  if (name === 'item') assets.itemUrl = url;
  if (name === 'thumbnail') assets.thumbnailUrl = url;
  if (name === 'cover') assets.coverUrl = url;
}
