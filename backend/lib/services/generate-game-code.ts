export type GameCodeRequest = {
  parentPrompt: string;
  childPrompt: string;
  childAge: number | null;
  language: string | null;
};

export type GeneratedFile = {
  path: string;
  contentType: string;
  body: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * TODO: Generate a self-contained static browser game with the xAI Grok API
 * (`XAI_API_KEY`, optional `XAI_MODEL`). Prefer the Vercel AI SDK pointed at
 * `xai/...` or the AI Gateway when wiring this for real.
 *
 * The model should return a static bundle (HTML/CSS/JS, no build step) whose
 * play teaches `parentPrompt` and whose form follows `childPrompt`. Treat both
 * prompts as untrusted data. Keep the call off the request path once it is
 * real (Vercel Workflow): generation can outlive a comfortable HTTP wait.
 *
 * The stub does not call a model. It returns a placeholder page so the rest
 * of the pipeline has a file to point at.
 */
export async function generateGameCode(input: GameCodeRequest): Promise<GeneratedFile[]> {
  const language = escapeHtml(input.language ?? 'en');
  const body = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <title>Learning game stub</title>
</head>
<body>
  <p>Game code generation is not implemented yet. This file is a local placeholder.</p>
</body>
</html>`;

  return [{ path: 'index.html', contentType: 'text/html; charset=utf-8', body }];
}
