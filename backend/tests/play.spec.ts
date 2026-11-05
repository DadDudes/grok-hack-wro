import { expect, test, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type PlayState = {
  scene: string;
  score: number;
  index: number;
  prompt: string;
  banner: string;
  player: { x: number; y: number; displayWidth: number; displayHeight: number } | null;
  choices: { text: string; x: number; y: number }[];
};

let server: ChildProcess;

test.beforeAll(async () => {
  server = spawn(process.execPath, ['tests/game-server.mjs'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('game server did not start')), 20_000);
    server.stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('ready')) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`game server exited ${code}`));
    });
  });
});

test.afterAll(() => {
  server?.kill();
});

async function state(page: Page): Promise<PlayState> {
  return page.evaluate(() => (window as unknown as { __EDUBOT_STATE: PlayState }).__EDUBOT_STATE);
}

async function openGame(page: Page, template: string) {
  await page.goto(`http://127.0.0.1:3011/${template}.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.dataset.gameReady === '1');
  await expect.poll(async () => (await state(page)).scene).toBe(template);
}

async function clickChoice(page: Page, text: string) {
  const point = await page.evaluate((wanted) => {
    const canvas = document.querySelector('canvas')!.getBoundingClientRect();
    const choice = (window as unknown as { __EDUBOT_STATE: PlayState }).__EDUBOT_STATE.choices.find(
      (item) => item.text === wanted,
    );
    if (!choice) return null;
    return {
      x: canvas.left + (choice.x / 960) * canvas.width,
      y: canvas.top + (choice.y / 540) * canvas.height,
    };
  }, text);
  expect(point).not.toBeNull();
  await page.mouse.click(point!.x, point!.y);
}

test('sprites stay small and nothing scores before input', async ({ page }) => {
  await openGame(page, 'collect');
  const first = await state(page);
  expect(first.score).toBe(0);
  expect(first.index).toBe(0);
  expect(first.prompt).toBe('Collect question 1');
  expect(first.player).not.toBeNull();
  expect(first.player!.displayWidth).toBeGreaterThan(40);
  expect(first.player!.displayWidth).toBeLessThan(100);
  expect(first.player!.displayHeight).toBeLessThan(100);
  await page.waitForTimeout(1000);
  const later = await state(page);
  expect(later.score).toBe(0);
  expect(later.index).toBe(0);
  expect(later.banner).toBe('');
});

test('collect moves with the keyboard and the on-screen button, then finishes by clicks', async ({ page }) => {
  await openGame(page, 'collect');
  const start = (await state(page)).player!.x;
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await state(page)).player!.x).toBeGreaterThan(start + 40);
  await page.keyboard.up('ArrowRight');

  const beforeButton = (await state(page)).player!.x;
  const button = page.locator('[data-control="left"]');
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect.poll(async () => (await state(page)).player!.x).toBeLessThan(beforeButton - 30);
  await page.mouse.up();

  await clickChoice(page, 'Collect-no-a-1');
  await expect.poll(async () => (await state(page)).banner).toContain('Nie.');
  expect((await state(page)).score).toBe(0);
  await expect.poll(async () => (await state(page)).banner).toBe('');

  for (let n = 1; n <= 3; n += 1) {
    await clickChoice(page, `Collect-yes-${n}`);
    if (n < 3) await expect.poll(async () => (await state(page)).index).toBe(n);
  }
  await expect.poll(async () => (await state(page)).scene).toBe('end');
  expect((await state(page)).score).toBe(3);
});

test('runner jumps, walks, and reaches the end screen from tappable labels', async ({ page }) => {
  await openGame(page, 'runner');
  await expect.poll(async () => (await state(page)).score).toBe(0);
  await expect.poll(async () => (await state(page)).player!.y).toBeGreaterThan(430);
  const grounded = (await state(page)).player!.y;
  await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).player!.y).toBeLessThan(grounded - 20);

  const start = (await state(page)).player!.x;
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await state(page)).player!.x).toBeGreaterThan(start + 30);
  await page.keyboard.up('ArrowRight');

  const jump = page.locator('[data-control="jump"]');
  await jump.click();
  await expect.poll(async () => (await state(page)).player!.displayWidth).toBeLessThan(100);

  for (let n = 1; n <= 3; n += 1) {
    await clickChoice(page, `Runner-yes-${n}`);
    if (n < 3) await expect.poll(async () => (await state(page)).index).toBe(n);
  }
  await expect.poll(async () => (await state(page)).scene).toBe('end');
  expect((await state(page)).score).toBe(3);
});

test('quiz accepts a wrong tap, clears it, then a number key and clicks to the end', async ({ page }) => {
  await openGame(page, 'quiz');
  expect((await state(page)).player).toBeNull();
  await clickChoice(page, 'Quiz-no-b-1');
  await expect.poll(async () => (await state(page)).banner).toContain('Nie.');
  expect((await state(page)).score).toBe(0);
  await expect.poll(async () => (await state(page)).banner).toBe('');

  const digit = await page.evaluate(() => {
    const choices = (window as unknown as { __EDUBOT_STATE: PlayState }).__EDUBOT_STATE.choices;
    return choices.findIndex((item) => item.text === 'Quiz-yes-1') + 1;
  });
  expect(digit).toBeGreaterThan(0);
  await page.keyboard.press(String(digit));
  await expect.poll(async () => (await state(page)).index).toBe(1);

  for (let n = 2; n <= 3; n += 1) {
    await clickChoice(page, `Quiz-yes-${n}`);
    if (n < 3) await expect.poll(async () => (await state(page)).index).toBe(n);
  }
  await expect.poll(async () => (await state(page)).scene).toBe('end');
  expect((await state(page)).score).toBe(3);
});
