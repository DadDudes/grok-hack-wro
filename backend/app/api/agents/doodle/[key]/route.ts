import { errorResponse } from '@/app/api/_lib/http';
import { getCachedImage, THEME_KEY_PATTERN } from '@/lib/agents/doodle';

const HTTP_NOT_FOUND = 404;
const IMAGE_CACHE_CONTROL = 'private, max-age=86400, immutable';

type DoodleContext = {
  params: Promise<{ key: string }>;
};

function notFound(): Response {
  return errorResponse(HTTP_NOT_FOUND, {
    code: 'not_found',
    message: 'No image for this theme.',
    retryable: false,
  });
}

export async function GET(_request: Request, context: DoodleContext): Promise<Response> {
  const { key } = await context.params;

  if (!THEME_KEY_PATTERN.test(key)) {
    return notFound();
  }

  const image = getCachedImage(key);

  if (image === null) {
    return notFound();
  }

  const headers = {
    'content-type': image.mimeType,
    'cache-control': IMAGE_CACHE_CONTROL,
  };

  return new Response(image.bytes, { headers });
}
