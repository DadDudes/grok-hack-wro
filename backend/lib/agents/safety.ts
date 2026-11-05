/** Last-line filter for strings that would be shown to a child. Not a substitute for the model prompt. */
const blocked =
  /\b(porn|xxx|nsfw|suicide|nazi)\b|pornograf|gwałt|seks\s+z\b|child\s*sex/i;

export function isChildSafeText(value: string): boolean {
  return !blocked.test(value);
}

export function assertChildSafe(fields: string[]): void {
  const joined = fields.join('\n');
  if (!isChildSafeText(joined)) {
    throw new Error('Generated player-facing text failed the child-safety check.');
  }
}

/** Image prompts are untrusted model text. Keep a short wholesome subject or replace it. */
export function cleanImagePrompt(value: string, fallback: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length < 3 || text.length > 400) return fallback;
  if (/https?:|ignore previous|system prompt|<\/?[a-z]/i.test(text)) return fallback;
  if (!isChildSafeText(text)) return fallback;
  return text;
}
