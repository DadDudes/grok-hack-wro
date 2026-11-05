import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { lessonOverrides } from './request-fields.ts';

describe('lessonOverrides', () => {
  it('maps quiz_battle and keeps the supplied tasks', () => {
    const overrides = lessonOverrides({
      parentPrompt: 'Multiplication up to 50',
      childPrompt: 'Dinosaurs in space',
      questionCount: 4,
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

    assert.equal(overrides.lockTemplate, true);
    assert.equal(overrides.template, 'quiz');
    assert.equal(overrides.questionCount, 4);
    assert.equal(overrides.tasks?.[0]?.id, 't1');
  });

  it('reads the older prompt text when structured fields are absent', () => {
    const overrides = lessonOverrides({
      parentPrompt: [
        'Learning goal: Multiplication up to 50',
        'Questions: 5',
        'Tasks (question | answer | wrong answers | difficulty | skill):',
        't1. 2 x 5 = ? | 10 | 7, 12, 25 | 1 | 2x table',
        't2. 3 x 4 = ? | 12 | 7, 14, 9 | 1 | 3x table',
      ].join('\n'),
      childPrompt: ['Kid\'s idea: dinosaurs in space', 'Game type: quiz_battle', 'Game title: Star eggs'].join('\n'),
    });

    assert.equal(overrides.template, 'quiz');
    assert.equal(overrides.questionCount, 5);
    assert.equal(overrides.title, 'Star eggs');
    assert.equal(overrides.tasks?.length, 2);
    assert.equal(overrides.tasks?.[1]?.answer, '12');
    assert.deepEqual(overrides.tasks?.[0]?.distractors, ['7', '12', '25']);
  });

  it('drops unsafe supplied tasks and leaves the template unlocked', () => {
    const overrides = lessonOverrides({
      parentPrompt: 'Colors',
      childPrompt: 'collect stars',
      tasks: [
        {
          id: 't1',
          question: 'A nazi flag is this color?',
          answer: 'red',
          distractors: ['blue', 'green'],
          difficulty: 1,
        },
      ],
    });

    assert.equal(overrides.lockTemplate, false);
    assert.equal(overrides.template, undefined);
    assert.equal(overrides.tasks, undefined);
  });
});
