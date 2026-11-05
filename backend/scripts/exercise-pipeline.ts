/**
 * Runs the generation pipeline with no xAI key and no Supabase.
 * Usage: npm run exercise
 */
import assert from 'node:assert/strict';

import { readGameImage } from '../lib/assets/image-store.ts';
import { createGame, runGamePipeline } from '../lib/games/create-game.ts';
import { getGame } from '../lib/games/get-game.ts';
import { getGameRepository } from '../lib/games/store.ts';
import { renderPlayHtml } from '../lib/play/render-html.ts';

process.env.GAME_STORE = 'memory';
delete process.env.XAI_API_KEY;
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const samples = [
  {
    template: 'runner',
    parentPrompt: 'naucz mojego syna nazw części ciała po angielsku',
    childPrompt: 'chcę grę w której skacze się po górach!',
    answer: 'head',
  },
  {
    template: 'collect',
    parentPrompt: 'naucz kolorów po angielsku',
    childPrompt: 'chcę zbierać gwiazdki',
    answer: 'red',
  },
  {
    template: 'quiz',
    parentPrompt: 'nazwy zwierząt po angielsku',
    childPrompt: 'chcę quiz',
    answer: 'dog',
  },
] as const;

const origin = 'http://127.0.0.1:3001';

for (const sample of samples) {
  const created = await createGame({
    parentPrompt: sample.parentPrompt,
    childPrompt: sample.childPrompt,
    childAge: 8,
    language: 'pl',
  });
  await runGamePipeline(created.id, origin);
  const ready = await getGame(created.id);
  assert.ok(ready);
  assert.equal(ready.status, 'ready');
  assert.equal(ready.template, sample.template);
  assert.equal(ready.gameUrl, `${origin}/play/${created.id}`);
  const spec = await getGameRepository().getSpec(created.id);
  assert.ok(spec);
  assert.ok(spec.tasks.some((task) => task.answer === sample.answer));
  const html = renderPlayHtml(spec);
  assert.match(html, /phaser@3\.90\.0/);
  assert.match(html, new RegExp(sample.answer));
  const thumbnail = await readGameImage(created.id, 'thumbnail');
  assert.equal(thumbnail?.bytes[0], 137);
  console.log(`${sample.template}\t${ready.gameUrl}\t${spec.title}`);
}

console.log('Fallback pipeline ok.');
