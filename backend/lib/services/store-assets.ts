import { getSupabaseAdmin } from '@/lib/supabase/client';

import type { GeneratedFile } from './generate-game-code';
import type { GeneratedGraphics, GeneratedImage } from './generate-graphics';

export type StoredAssets = {
  thumbnailUrl: string;
  coverUrl: string;
  assetUrls: string[];
};

const BUCKET = 'game-assets';

function placeholderBase(): string {
  return (process.env.GAME_ASSET_BASE_URL ?? 'https://cdn.example.invalid/game-assets').replace(
    /\/$/,
    '',
  );
}

/** Public URL for one object. Uses the Supabase bucket when the project URL is set. */
export function publicAssetUrl(gameId: string, objectPath: string): string {
  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${gameId}/${objectPath}`;
  }
  return `${placeholderBase()}/${gameId}/${objectPath}`;
}

function mimeType(contentType: string): string {
  return contentType.split(';')[0]?.trim() || 'application/octet-stream';
}

async function uploadObject(
  gameId: string,
  objectPath: string,
  body: Uint8Array | string,
  contentType: string,
): Promise<void> {
  const client = getSupabaseAdmin();
  if (!client) return;

  const bytes = typeof body === 'string' ? new TextEncoder().encode(body) : body;
  const { error } = await client.storage.from(BUCKET).upload(`${gameId}/${objectPath}`, bytes, {
    contentType: mimeType(contentType),
    upsert: true,
  });
  if (error) {
    throw new Error(`Storage upload failed for ${objectPath}: ${error.message}`);
  }
}

/**
 * Uploads the bundle and images to the `game-assets` bucket when Supabase is
 * configured. The service role bypasses storage RLS. Upsert uses insert,
 * select, and update, which the service role is allowed to do.
 *
 * TODO: replace the placeholder SVG bytes with real generated art.
 * Without Supabase, this returns `.invalid` placeholder URLs and uploads nothing.
 */
export async function storeGameAssets(
  gameId: string,
  files: GeneratedFile[],
  graphics: GeneratedGraphics,
): Promise<StoredAssets> {
  const images: GeneratedImage[] = [graphics.thumbnail, graphics.cover, ...graphics.assets];

  if (getSupabaseAdmin()) {
    await Promise.all([
      ...files.map((file) => uploadObject(gameId, file.path, file.body, file.contentType)),
      ...images.map((image) => uploadObject(gameId, image.path, image.body, image.contentType)),
    ]);
  }

  return {
    thumbnailUrl: publicAssetUrl(gameId, graphics.thumbnail.path),
    coverUrl: publicAssetUrl(gameId, graphics.cover.path),
    assetUrls: [
      ...files.map((file) => publicAssetUrl(gameId, file.path)),
      ...graphics.assets.map((image) => publicAssetUrl(gameId, image.path)),
    ],
  };
}
