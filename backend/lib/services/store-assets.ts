import type { GeneratedFile } from './generate-game-code';
import type { GeneratedGraphics } from './generate-graphics';

export type StoredAssets = {
  thumbnailUrl: string;
  coverUrl: string;
  assetUrls: string[];
};

function assetBase(): string {
  return (process.env.GAME_ASSET_BASE_URL ?? 'https://cdn.example.invalid/game-assets').replace(
    /\/$/,
    '',
  );
}

/**
 * TODO: Upload the bundle and images to the Supabase Storage bucket
 * `game-assets` with the service-role client:
 *
 *   {gameId}/index.html
 *   {gameId}/thumbnail.svg
 *   {gameId}/cover.svg
 *   {gameId}/assets/...
 *
 * Public URL shape once the bucket migration has been applied:
 *   ${SUPABASE_URL}/storage/v1/object/public/game-assets/${gameId}/${path}
 *
 * Upsert needs insert, select, and update. The service role bypasses storage
 * RLS, so those policies are not required for this server. Do not upload with
 * the anon key.
 *
 * The stub does not upload. It returns placeholder URLs on `.invalid`, which
 * is a reserved example domain and will not resolve.
 */
export async function storeGameAssets(
  gameId: string,
  files: GeneratedFile[],
  graphics: GeneratedGraphics,
): Promise<StoredAssets> {
  const base = assetBase();
  const assetUrls = [
    ...files.map((file) => `${base}/${gameId}/${file.path}`),
    ...graphics.assets.map((file) => `${base}/${gameId}/${file.path}`),
  ];

  return {
    thumbnailUrl: `${base}/${gameId}/${graphics.thumbnail.path}`,
    coverUrl: `${base}/${gameId}/${graphics.cover.path}`,
    assetUrls,
  };
}
