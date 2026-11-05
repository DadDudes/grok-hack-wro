export type GeneratedImage = {
  path: string;
  contentType: string;
  body: Uint8Array;
};

export type GeneratedGraphics = {
  thumbnail: GeneratedImage;
  cover: GeneratedImage;
  assets: GeneratedImage[];
};

function svg(label: string): Uint8Array {
  const document = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#f4f4f4"/>
  <text x="32" y="180" fill="#222" font-size="28" font-family="sans-serif">${label}</text>
</svg>`;
  return new TextEncoder().encode(document);
}

/**
 * TODO: Generate a thumbnail, a cover, and any in-game art for the child's
 * concept. Keep the images appropriate for `childAge`. Do not call an image
 * API from this stub.
 *
 * These SVG bytes exist so Supabase Storage has a real file to serve. They
 * are not illustrations of the game.
 */
export async function generateGraphics(): Promise<GeneratedGraphics> {
  return {
    thumbnail: { path: 'thumbnail.svg', contentType: 'image/svg+xml', body: svg('Stub thumbnail') },
    cover: { path: 'cover.svg', contentType: 'image/svg+xml', body: svg('Stub cover') },
    assets: [
      {
        path: 'assets/placeholder.svg',
        contentType: 'image/svg+xml',
        body: svg('Stub asset'),
      },
    ],
  };
}
