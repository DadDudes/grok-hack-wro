import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { zodErrorDetails } from './errors.ts';
import { createGameRequestSchema, gameSchema } from './schemas.ts';

const gameId = '550e8400-e29b-41d4-a716-446655440000';

describe('createGameRequestSchema', () => {
  it('accepts a parent goal, a child game idea, and optional age and language', () => {
    const parsed = createGameRequestSchema.parse({
      parentPrompt: '  Ułamki zwykłe: dodawanie o tym samym mianowniku.  ',
      childPrompt: ' Gra platformowa, w której zbieram monety-ułamki. ',
      childAge: 10,
      language: 'pl',
    });

    assert.equal(parsed.parentPrompt, 'Ułamki zwykłe: dodawanie o tym samym mianowniku.');
    assert.equal(parsed.childPrompt, 'Gra platformowa, w której zbieram monety-ułamki.');
    assert.equal(parsed.childAge, 10);
    assert.equal(parsed.language, 'pl');
  });

  it('accepts the two required strings alone', () => {
    const parsed = createGameRequestSchema.parse({
      parentPrompt: 'Addition up to 20',
      childPrompt: 'A quiz-show game',
    });

    assert.equal(parsed.childAge, undefined);
    assert.equal(parsed.language, undefined);
  });

  it('rejects unknown fields, empty prompts, and an age outside 3–18', () => {
    const result = createGameRequestSchema.safeParse({
      parentPrompt: '   ',
      childPrompt: '',
      childAge: 2,
      extra: true,
    });

    assert.equal(result.success, false);
    if (!result.success) {
      const details = zodErrorDetails(result.error);
      assert.ok(details.some((detail) => detail.path === 'parentPrompt'));
      assert.ok(details.some((detail) => detail.path === 'childAge'));
      assert.ok(details.some((detail) => detail.path === '(root)'));
    }
  });
});

describe('gameSchema', () => {
  it('accepts the stub response shape', () => {
    const createdAt = '2026-11-05T17:50:00.000Z';
    const parsed = gameSchema.parse({
      id: gameId,
      parentPrompt: 'Addition up to 20',
      childPrompt: 'A quiz-show game',
      childAge: null,
      language: null,
      status: 'ready',
      gameUrl: `https://games.example.invalid/${gameId}`,
      graphics: {
        thumbnailUrl: `https://cdn.example.invalid/game-assets/${gameId}/thumbnail.svg`,
        coverUrl: `https://cdn.example.invalid/game-assets/${gameId}/cover.svg`,
        assetUrls: [`https://cdn.example.invalid/game-assets/${gameId}/index.html`],
      },
      error: null,
      createdAt,
      updatedAt: createdAt,
    });

    assert.equal(parsed.status, 'ready');
    assert.equal(parsed.graphics.assetUrls.length, 1);
  });
});
