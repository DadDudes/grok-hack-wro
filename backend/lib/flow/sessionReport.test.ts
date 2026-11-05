import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { sessionReport } from '@/lib/flow/sessionReport';
import type { GameEvent, LensRequest, SessionResult, TaskPlan } from '@/lib/flow/types';
import { winHeadline } from '@/components/state/derive';

const DEMO_WORDS = ['dinosaur', '7x table', '8x table', 'multiplication', '40%', '75%'];

const bodyPlan: TaskPlan = {
  goal: 'Learn English body parts: head, arm, leg',
  age: 8,
  tasks: [
    { id: 'head', question: 'What do you think with?', answer: 'head', distractors: ['arm', 'leg', 'ear'], difficulty: 1, skill: 'Head' },
    { id: 'arm', question: 'What swings when you say hello?', answer: 'arm', distractors: ['leg', 'head', 'ear'], difficulty: 1, skill: 'Arm' },
    { id: 'leg', question: 'What do you walk on?', answer: 'leg', distractors: ['arm', 'head', 'ear'], difficulty: 2, skill: 'Leg' },
    { id: 'ear', question: 'What do you hear with?', answer: 'ear', distractors: ['arm', 'head', 'leg'], difficulty: 2, skill: 'Ear' },
    { id: 'eye', question: 'What do you see with?', answer: 'eye', distractors: ['arm', 'head', 'leg'], difficulty: 3, skill: 'Eye' },
  ],
};

const timesPlan: TaskPlan = {
  goal: 'Multiplication up to 50',
  age: 8,
  tasks: [
    { id: 'm1', question: '7 x 8 = ?', answer: '56', distractors: ['54', '48', '64'], difficulty: 2, skill: '7x table' },
  ],
};

function session(events: GameEvent[], id = 'game-body'): SessionResult {
  return { gameId: id, kidId: 'maja', events, hintsUsed: 0, seconds: 40 };
}

function answer(taskId: string, correct: boolean): GameEvent {
  return {
    source: 'edubotgames-game',
    type: 'answer',
    taskId,
    answer: correct ? 'yes' : 'no',
    correct,
    player: 'Maja',
    at: '2026-11-05T21:00:00.000Z',
  };
}

function request(plan: TaskPlan, events: GameEvent[], previous: SessionResult | null = null): LensRequest {
  return { plan, session: session(events), previous };
}

function blob(report: { parentSummary: string; pedagogueFeedback: string; bySkill: { skill: string }[]; weakSkills: string[] }): string {
  return `${report.parentSummary} ${report.pedagogueFeedback} ${report.weakSkills.join(' ')} ${report.bySkill.map((item) => item.skill).join(' ')}`.toLowerCase();
}

describe('sessionReport', () => {
  it('does not invent a demo score for a session with no answers', () => {
    const previous = session(
      [answer('m1', true)],
      'game-times',
    );
    const report = sessionReport({
      plan: bodyPlan,
      session: session([]),
      previous,
    });
    const text = blob(report);

    assert.equal(report.measured, false);
    assert.equal(report.accuracyNow, null);
    assert.equal(report.accuracyBefore, null);
    assert.equal(report.delta, null);
    assert.equal(report.weakSkills.length, 0);
    assert.deepEqual(
      report.bySkill.map((item) => item.skill),
      ['Head', 'Arm', 'Leg', 'Ear', 'Eye'],
    );
    assert.ok(report.bySkill.every((item) => item.now === null && item.before === null));
    for (const word of DEMO_WORDS) {
      assert.equal(text.includes(word), false, word);
    }
    assert.match(report.pedagogueFeedback, /Learn English body parts/);
    assert.match(report.pedagogueFeedback, /No new answers/);
  });

  it('scores only the answered skill in a partial session', () => {
    const report = sessionReport(request(bodyPlan, [answer('arm', false), answer('arm', true)]));

    assert.equal(report.measured, true);
    assert.equal(report.accuracyNow, 0);
    assert.equal(report.accuracyBefore, null);
    assert.equal(report.delta, null);
    assert.deepEqual(report.weakSkills, ['Arm']);
    const arm = report.bySkill.find((item) => item.skill === 'Arm');
    const head = report.bySkill.find((item) => item.skill === 'Head');
    assert.equal(arm?.now, 0);
    assert.equal(head?.now, null);
    assert.equal(blob(report).includes('dinosaur'), false);
    assert.equal(blob(report).includes('75%'), false);
  });

  it('keeps a finished body-parts session away from an older multiplication session', () => {
    const events = bodyPlan.tasks.map((task) => answer(task.id, true));
    const previous = session([answer('m1', false)], 'game-times');
    const report = sessionReport({
      plan: bodyPlan,
      session: session(events),
      previous,
    });

    assert.equal(report.measured, true);
    assert.equal(report.accuracyNow, 1);
    assert.equal(report.accuracyBefore, null);
    assert.equal(report.delta, null);
    assert.ok(report.bySkill.every((item) => item.now === 1 && item.before === null));
    assert.equal(blob(report).includes('7x table'), false);
  });

  it('uses a previous session only when the task ids match', () => {
    const previous = session([answer('head', true), answer('arm', false)]);
    const report = sessionReport(request(bodyPlan, [answer('head', true), answer('arm', true)], previous));

    assert.equal(report.accuracyNow, 1);
    assert.equal(report.accuracyBefore, 0.5);
    assert.equal(report.delta, 0.5);
    const head = report.bySkill.find((item) => item.skill === 'Head');
    assert.equal(head?.before, 1);
    assert.equal(head?.now, 1);
  });

  it('does not borrow the multiplication demo plan into a body-parts report', () => {
    const foreign = sessionReport(request(timesPlan, [answer('m1', true)]));
    const quiet = sessionReport(request(bodyPlan, []));

    assert.match(foreign.pedagogueFeedback, /Multiplication up to 50/);
    assert.equal(quiet.pedagogueFeedback.includes(foreign.bySkill[0]?.skill ?? '7x table'), false);
  });
});

describe('winHeadline', () => {
  it('does not celebrate an empty finish as a clear', () => {
    assert.equal(winHeadline('Maja', 0, 5), 'Good try, Maja!');
    assert.equal(winHeadline('Maja', 3, 5), 'Nice work, Maja!');
    assert.equal(winHeadline('Maja', 5, 5), 'You did it, Maja!');
  });
});
