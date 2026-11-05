import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const base = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3001';

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${response.status} ${text.slice(0, 300)}`);
  }
}

async function pollGame(id) {
  const deadline = Date.now() + 30_000;
  let game;
  while (Date.now() < deadline) {
    const response = await fetch(`${base}/api/games/${id}`);
    game = await readJson(response);
    if (game.status === 'ready' || game.status === 'failed') return game;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`game ${id} stuck at ${game?.status}`);
}

const health = await readJson(await fetch(`${base}/api/health`));
assert.equal(health.ok, true);
assert.equal(health.service, 'games-api');
assert.equal(health.storage, 'memory');

const home = await fetch(`${base}/`, { redirect: 'manual' });
assert.equal(home.status, 307);
assert.match(home.headers.get('location') ?? '', /\/login$/);
const loginHtml = await (await fetch(`${base}/login`)).text();
assert.match(loginHtml, /Log in/);
assert.equal(loginHtml.includes('Developer test'), false);

const pick = await fetch(`${base}/play/pick`);
assert.equal(pick.status, 200);
const pickHtml = await pick.text();
assert.equal(pickHtml.includes('Id gry musi'), false);

const runtime = await (await fetch(`${base}/phaser/runtime.js`)).text();
assert.match(runtime, /edubotgames-game/);

const created = await fetch(`${base}/api/games`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    parentPrompt: 'Multiplication up to 50',
    childPrompt: 'dinosaurs in space',
    childAge: 8,
    language: 'en',
    questionCount: 4,
    template: 'quiz_battle',
    tasks: [
      { id: 't1', question: '2 x 5 = ?', answer: '10', distractors: ['7', '12', '25'], difficulty: 1, skill: '2x table' },
      { id: 't2', question: '3 x 4 = ?', answer: '12', distractors: ['7', '14', '9'], difficulty: 1, skill: '3x table' },
      { id: 't3', question: '6 x 7 = ?', answer: '42', distractors: ['36', '48', '13'], difficulty: 2, skill: '7x table' },
      { id: 't4', question: '4 x 7 = ?', answer: '28', distractors: ['24', '32', '11'], difficulty: 2, skill: '4x table' },
    ],
  }),
});
assert.equal(created.status, 202);
const queued = await readJson(created);
assert.equal(queued.status, 'queued');
assert.equal(queued.template, null);
const ready = await pollGame(queued.id);
assert.equal(ready.status, 'ready');
assert.equal(ready.template, 'quiz');
assert.match(ready.gameUrl, new RegExp(`/play/${queued.id}$`));

const playHtml = await (await fetch(ready.gameUrl)).text();
assert.match(playHtml, /phaser@3\.90\.0/);
assert.match(playHtml, /\/phaser\/runtime\.js/);
assert.match(playHtml, /2 x 5/);

const legacy = await fetch(`${base}/api/games`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    parentPrompt: 'naucz mojego syna nazw części ciała po angielsku',
    childPrompt: 'chcę grę w której skacze się po górach!',
    childAge: 8,
    language: 'pl',
  }),
});
assert.equal(legacy.status, 202);
const legacyReady = await pollGame((await readJson(legacy)).id);
assert.equal(legacyReady.template, 'runner');

const prof = await fetch(`${base}/api/agents/prof`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    kidId: 'maja',
    topic: 'Multiplication up to 50',
    age: 8,
    questionCount: 5,
    language: 'en',
  }),
});
assert.equal(prof.status, 200);
const plan = await readJson(prof);
assert.equal(plan.tasks.length, 5);
assert.equal(plan.tasks[0].answer, '10');

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Log in' }).click();
await page.waitForURL('**/parent');
await page.getByRole('main').getByRole('link', { name: 'New goal' }).click();
await page.waitForURL('**/parent/goal');
await page.locator('#goal-text').fill('Multiplication up to 50');
await page.locator('label').filter({ has: page.locator('input[name="goal-count"][value="5"]') }).click();
await page.getByRole('button', { name: 'Create game' }).click();
await page.waitForURL('**/parent/plan');
await page.getByRole('button', { name: 'Send to Maja' }).click();
await page.getByRole('link', { name: 'Open kid mode' }).click();
await page.waitForURL('**/play');
await page.getByLabel('Type your idea').fill('dinosaurs in space');
await page.getByRole('button', { name: 'Send idea' }).click();
await page.waitForURL('**/play/pick');
await page.getByRole('button', { name: /Quiz battle/ }).click();
await page.getByRole('button', { name: 'Build my game!' }).click();
await page.waitForURL('**/play/game', { timeout: 60_000 });
const frame = page.frameLocator('iframe[title="Your game"]');
await frame.locator('canvas').waitFor({ timeout: 30_000 });
await page.waitForFunction(() => {
  const iframe = document.querySelector('iframe[title="Your game"]');
  const state = iframe?.contentWindow?.__EDUBOT_STATE;
  return state && state.scene === 'quiz' && String(state.prompt).includes('2 x 5');
});
const before = await page.evaluate(() => document.querySelector('iframe').contentWindow.__EDUBOT_STATE.score);
assert.equal(before, 0);
await page.frameLocator('iframe[title="Your game"]').locator('body').click({ position: { x: 10, y: 10 } });
const point = await page.evaluate(() => {
  const iframe = document.querySelector('iframe');
  const frameBox = iframe.getBoundingClientRect();
  const win = iframe.contentWindow;
  const canvas = iframe.contentDocument.querySelector('canvas').getBoundingClientRect();
  const choice = win.__EDUBOT_STATE.choices.find((item) => item.text === '7');
  return {
    x: frameBox.left + canvas.left + (choice.x / 960) * canvas.width,
    y: frameBox.top + canvas.top + (choice.y / 540) * canvas.height,
  };
});
await page.mouse.click(point.x, point.y);
await page.waitForFunction(() => {
  const state = document.querySelector('iframe').contentWindow.__EDUBOT_STATE;
  return state.banner && state.banner.length > 0;
});
assert.equal(await page.evaluate(() => document.querySelector('iframe').contentWindow.__EDUBOT_STATE.score), 0);
await browser.close();
console.log('smoke ok');
