import type { ImageSlot } from '@/lib/game-spec/schema';
import { sniffImage } from '@/lib/agents/xai';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export type StoredImage = {
  name: ImageSlot;
  bytes: Uint8Array;
  contentType: string;
};

const BUCKET = 'game-assets';
const memory = new Map<string, Map<string, { bytes: Uint8Array; contentType: string }>>();

function extension(contentType: string): string {
  if (contentType === 'image/jpeg') return '.jpg';
  if (contentType === 'image/webp') return '.webp';
  return '.png';
}

export function rememberImage(gameId: string, image: StoredImage): void {
  const bucket = memory.get(gameId) ?? new Map<string, { bytes: Uint8Array; contentType: string }>();
  bucket.set(image.name, { bytes: image.bytes, contentType: image.contentType });
  memory.set(gameId, bucket);
}

/**
 * Keeps bytes on this instance and, when Supabase is configured, uploads them.
 * A failed upload returns false so the spec omits that URL and the template draws a shape.
 */
export async function publishImage(gameId: string, image: StoredImage): Promise<boolean> {
  rememberImage(gameId, image);
  const client = getSupabaseAdmin();
  if (!client) return true;

  const path = `${gameId}/images/${image.name}${extension(image.contentType)}`;
  const { error } = await client.storage.from(BUCKET).upload(path, image.bytes, {
    contentType: image.contentType,
    upsert: true,
  });
  if (error) {
    console.error('Image upload failed', { gameId, path, message: error.message });
    return false;
  }
  return true;
}

/** Best-effort copy of the spec next to the images. The row is the source of truth. */
export async function publishSpecJson(gameId: string, spec: unknown): Promise<string | null> {
  const client = getSupabaseAdmin();
  const base = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
  if (!client || !base) return null;

  const path = `${gameId}/spec.json`;
  const { error } = await client.storage.from(BUCKET).upload(path, JSON.stringify(spec), {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) {
    console.error('Spec upload failed', { gameId, message: error.message });
    return null;
  }
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function readGameImage(
  gameId: string,
  name: string,
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const local = memory.get(gameId)?.get(name);
  if (local) return local;

  const client = getSupabaseAdmin();
  if (!client) return null;

  for (const suffix of ['.png', '.jpg', '.jpeg', '.webp']) {
    const path = `${gameId}/images/${name}${suffix}`;
    const { data, error } = await client.storage.from(BUCKET).download(path);
    if (error || !data) continue;
    const bytes = new Uint8Array(await data.arrayBuffer());
    const contentType = sniffImage(bytes, data.type);
    rememberImage(gameId, { name: name as ImageSlot, bytes, contentType });
    return { bytes, contentType };
  }
  return null;
}
