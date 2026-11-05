import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

import { readGameImage } from '../assets/image-store.ts';
import { createGame, runGamePipeline } from './create-game.ts';
import { getGame } from './get-game.ts';
import { readStoredResult } from './memory-repository.ts';
import { getGameRepository } from './store.ts';

const saved = {
  store: process.env.GAME_STORE,
  key: process.env.XAI_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

function useMemoryStore(): void {
  process.env.GAME_STORE = 'memory';
  delete process.env.XAI_API_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

after(() => {
  if (saved.store === undefined) delete process.env.GAME_STORE;
  else process.env.GAME_STORE = saved.store;
  if (saved.key === undefined) delete process.env.XAI_API_KEY;
  else process.env.XAI_API_KEY = saved.key;
  if (saved.supabaseUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = saved.supabaseUrl;
  if (saved.supabaseKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = saved.supabaseKey;
});

describe('fallback pipeline', () => {
  it('stores a ready runner and a PNG thumbnail without calling xAI', async () => {
    useMemoryStore();
    const origin = 'http://127.0.0.1:3001';
    const created = await createGame({
      parentPrompt: 'naucz mojego syna nazw części ciała po angielsku',
      childPrompt: 'chcę grę w której skacze się po górach!',
      childAge: 8,
      language: 'pl',
    });

    assert.equal(created.status, 'queued');
    assert.equal(created.template, null);
    assert.equal(created.gameUrl, null);

    await runGamePipeline(created.id, origin);
    const ready = await getGame(created.id);
    assert.ok(ready);
    assert.equal(ready.status, 'ready');
    assert.equal(ready.template, 'runner');
    assert.equal(ready.gameUrl, `${origin}/play/${created.id}`);
    assert.equal(ready.error, null);
    assert.equal(ready.graphics.thumbnailUrl, `${origin}/play/${created.id}/assets/thumbnail`);
    assert.equal(ready.graphics.coverUrl, `${origin}/play/${created.id}/assets/cover`);

    const spec = await getGameRepository().getSpec(created.id);
    assert.ok(spec);
    assert.equal(spec.source, 'fallback');
    assert.equal(spec.assets.characterUrl, null);
    assert.ok(spec.tasks.some((task) => task.answer === 'head'));

    const thumbnail = await readGameImage(created.id, 'thumbnail');
    assert.ok(thumbnail);
    assert.equal(thumbnail.contentType, 'image/png');
    assert.equal(thumbnail.bytes[0], 137);
    assert.equal(thumbnail.bytes[1], 80);

    const savedResult = await getGameRepository().saveResult(created.id, {
      score: 4,
      total: spec.tasks.length,
      correct: 4,
      durationMs: 1000,
      receivedAt: new Date().toISOString(),
    });
    assert.equal(savedResult, true);
    assert.equal(readStoredResult(created.id)?.score, 4);
    assert.equal(await getGameRepository().saveResult('550e8400-e29b-41d4-a716-446655440000', {
      score: 0,
      total: 1,
      correct: 0,
      durationMs: null,
      receivedAt: new Date().toISOString(),
    }), false);
  });
});
