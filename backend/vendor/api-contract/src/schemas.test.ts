import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { zodErrorDetails } from './errors.ts';
import { createGameRequestSchema, gameResultRequestSchema, gameSchema } from './schemas.ts';

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
    assert.equal(parsed.questionCount, undefined);
    assert.equal(parsed.template, undefined);
    assert.equal(parsed.tasks, undefined);
  });

  it('accepts a question count, quiz_battle, and the task list', () => {
    const parsed = createGameRequestSchema.parse({
      parentPrompt: 'Multiplication up to 50',
      childPrompt: 'Dinosaurs in space',
      childAge: 8,
      language: 'en',
      questionCount: 5,
      template: 'quiz_battle',
      tasks: [
        {
          id: 't1',
          question: '2 x 5 = ?',
          answer: '10',
          distractors: ['7', '12', '25'],
          difficulty: 1,
          skill: '2x table',
        },
      ],
    });

    assert.equal(parsed.questionCount, 5);
    assert.equal(parsed.template, 'quiz_battle');
    assert.equal(parsed.tasks?.length, 1);
    assert.equal(parsed.tasks?.[0]?.id, 't1');
    assert.deepEqual(parsed.tasks?.[0]?.distractors, ['7', '12', '25']);
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
      template: 'quiz',
      gameUrl: `https://games.example.invalid/play/${gameId}`,
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
    assert.equal(parsed.template, 'quiz');
    assert.equal(parsed.graphics.assetUrls.length, 1);
  });

  it('accepts a queued game before a template exists', () => {
    const createdAt = '2026-11-05T17:50:00.000Z';
    const parsed = gameSchema.parse({
      id: gameId,
      parentPrompt: 'Addition up to 20',
      childPrompt: 'A quiz-show game',
      childAge: null,
      language: null,
      status: 'queued',
      template: null,
      gameUrl: null,
      graphics: { thumbnailUrl: null, coverUrl: null, assetUrls: [] },
      error: null,
      createdAt,
      updatedAt: createdAt,
    });
    assert.equal(parsed.template, null);
    assert.equal(parsed.gameUrl, null);
  });
});

describe('gameResultRequestSchema', () => {
  it('accepts a score report and rejects extra fields', () => {
    const parsed = gameResultRequestSchema.parse({ score: 3, total: 4, correct: 3, durationMs: 12000 });
    assert.equal(parsed.score, 3);
    const rejected = gameResultRequestSchema.safeParse({ score: 1, total: 1, correct: 1, note: 'x' });
    assert.equal(rejected.success, false);
  });
});
