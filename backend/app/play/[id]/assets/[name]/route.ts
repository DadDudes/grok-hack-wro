import { z } from 'zod';

import { readGameImage } from '@/lib/assets/image-store';
import { imageSlotSchema } from '@/lib/game-spec/schema';

export const dynamic = 'force-dynamic';

const gameIdSchema = z.uuid();

type RouteContext = {
  params: Promise<{ id: string; name: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id, name } = await context.params;
  const parsedId = gameIdSchema.safeParse(id);
  const parsedName = imageSlotSchema.safeParse(name);
  if (!parsedId.success || !parsedName.success) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const image = await readGameImage(parsedId.data, parsedName.data);
    if (!image) {
      return new Response('Not found', { status: 404 });
    }
    const body = new ArrayBuffer(image.bytes.byteLength);
    new Uint8Array(body).set(image.bytes);
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': image.contentType,
        'content-disposition': 'inline',
        'cache-control': 'public, max-age=86400',
        'access-control-allow-origin': '*',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('GET /play/:id/assets/:name failed', error);
    return new Response('Not found', { status: 404 });
  }
}
