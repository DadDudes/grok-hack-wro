export type GeneratedImage = {
  path: string;
  contentType: string;
  /** TODO: real image bytes. Empty while generation is stubbed. */
  body: Uint8Array;
};

export type GeneratedGraphics = {
  thumbnail: GeneratedImage;
  cover: GeneratedImage;
  assets: GeneratedImage[];
};

/**
 * TODO: Generate a thumbnail, a cover, and any in-game art for the child's
 * concept. Keep the images appropriate for `childAge`. Do not call an image
 * API from this stub.
 *
 * Candidate sources, once implemented: an image model via the Vercel AI
 * Gateway, or a small set of authored templates selected by the model.
 * Upload the bytes in `storeGameAssets`.
 */
export async function generateGraphics(): Promise<GeneratedGraphics> {
  const empty = new Uint8Array();
  return {
    thumbnail: { path: 'thumbnail.svg', contentType: 'image/svg+xml', body: empty },
    cover: { path: 'cover.svg', contentType: 'image/svg+xml', body: empty },
    assets: [{ path: 'assets/placeholder.svg', contentType: 'image/svg+xml', body: empty }],
  };
}
