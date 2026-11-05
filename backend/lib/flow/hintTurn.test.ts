import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyHint,
  beginHint,
  createHintTurn,
  invalidateHint,
  noteAnswer,
  resetHint,
} from '@/lib/flow/hintTurn';

const WELCOME = 'I am on your team! I give hints, not answers.';
const THINKING = 'Hmm, let me think...';
const CHEER = 'Super! Keep going!';
const STALE = 'Not your foot. What swings when you say hello?';

describe('hint turns', () => {
  it('drops a delayed hint after a later correct answer', () => {
    const started = beginHint(createHintTurn(WELCOME), THINKING);
    const cheered = noteAnswer(started.turn, CHEER, 'done');
    const late = applyHint(cheered, started.requestId, STALE, 'idle');

    assert.equal(late.applied, false);
    assert.equal(late.turn.bubble.text, CHEER);
    assert.equal(late.turn.bubble.pose, 'done');
  });

  it('drops the old hint when it resolves on the next question', () => {
    const wrong = beginHint(createHintTurn(WELCOME), THINKING);
    const firstCorrect = noteAnswer(wrong.turn, 'Yes! Team score up!', 'done');
    const nextCorrect = noteAnswer(firstCorrect, CHEER, 'done');
    const late = applyHint(nextCorrect, wrong.requestId, STALE, 'idle');

    assert.equal(late.applied, false);
    assert.equal(late.turn.bubble.text, CHEER);
  });

  it('applies a hint that is still the latest request', () => {
    const started = beginHint(createHintTurn(WELCOME), THINKING);
    const applied = applyHint(started.turn, started.requestId, 'Think about the word for hand.', 'idle');

    assert.equal(applied.applied, true);
    assert.equal(applied.turn.bubble.text, 'Think about the word for hand.');
  });

  it('ignores an older hint after a newer wrong answer starts', () => {
    const first = beginHint(createHintTurn(WELCOME), THINKING);
    const second = beginHint(first.turn, THINKING);
    const late = applyHint(second.turn, first.requestId, STALE, 'idle');
    const current = applyHint(late.turn, second.requestId, 'Try the waving word.', 'idle');

    assert.equal(late.applied, false);
    assert.equal(current.applied, true);
    assert.equal(current.turn.bubble.text, 'Try the waving word.');
  });

  it('drops a hint after the session resets or the screen closes', () => {
    const started = beginHint(createHintTurn(WELCOME), THINKING);
    const closed = invalidateHint(started.turn);
    const restarted = resetHint(closed, WELCOME);
    const late = applyHint(restarted, started.requestId, STALE, 'idle');

    assert.equal(late.applied, false);
    assert.equal(late.turn.bubble.text, WELCOME);
    assert.equal(late.turn.bubble.pose, 'idle');
  });
});
