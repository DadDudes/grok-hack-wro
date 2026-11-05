import type { GameSpec } from '@/lib/game-spec/schema';

const PHASER_SRC = 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** JSON embedded in HTML must not be able to close the script tag. */
export function embedJson(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}

export function renderPlayHtml(spec: GameSpec): string {
  const title = escapeHtml(spec.title);
  const lang = escapeHtml(spec.language);
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="referrer" content="no-referrer" />
<title>${title}</title>
<style>
  html, body { margin: 0; height: 100%; background: #0e1116; }
  body { touch-action: none; overflow: hidden; }
  #game { width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="game"></div>
<script id="game-spec" type="application/json">${embedJson(spec)}</script>
<script src="${PHASER_SRC}"></script>
<script src="/phaser/runtime.js"></script>
</body>
</html>`;
}

export function renderStatusHtml(options: { title: string; message: string; refresh: boolean }): string {
  const title = escapeHtml(options.title);
  const message = escapeHtml(options.message);
  const refresh = options.refresh ? '<meta http-equiv="refresh" content="2" />' : '';
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${refresh}
<title>${title}</title>
</head>
<body style="font-family: system-ui, sans-serif; margin: 2rem; color: #102027;">
<p>${message}</p>
</body>
</html>`;
}

export function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': 'frame-ancestors *',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
