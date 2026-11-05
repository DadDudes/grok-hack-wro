import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fallbackGameSpec } from '../game-spec/fallback.ts';
import { embedJson, renderPlayHtml } from './render-html.ts';

const gameId = '550e8400-e29b-41d4-a716-446655440000';

describe('renderPlayHtml', () => {
  it('embeds the spec as JSON and loads Phaser plus the local runtime', () => {
    const spec = fallbackGameSpec({
      gameId,
      parentPrompt: 'naucz mojego syna nazw części ciała po angielsku',
      childPrompt: 'chcę grę w której skacze się po górach!',
      childAge: 8,
      language: 'pl',
    });
    const html = renderPlayHtml({ ...spec, title: '</script><img src=x onerror=alert(1)>' });

    assert.match(html, /phaser@3\.90\.0\/dist\/phaser\.min\.js/);
    assert.match(html, /src="\/phaser\/runtime\.js"/);
    assert.match(html, /<script id="game-spec" type="application\/json">/);
    const embedded = html.match(
      /<script id="game-spec" type="application\/json">([\s\S]*?)<\/script>/,
    );
    assert.ok(embedded);
    assert.equal(embedded[1]?.includes('<'), false);
    assert.equal(html.includes('</script><img'), false);
    assert.match(html, /<title>&lt;\/script&gt;/);
    const parsed = JSON.parse(embedded[1]!.replaceAll('\\u003c', '<'));
    assert.equal(parsed.template, 'runner');
    assert.equal(parsed.tasks.some((task: { answer: string }) => task.answer === 'head'), true);
  });

  it('escapes angle brackets inside embedded JSON', () => {
    assert.equal(embedJson({ value: '</script>' }).includes('<'), false);
  });
});
