import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { localGameOptions, localTaskPlan } from '@/lib/agents/local-fallback';

describe('local agent fallback', () => {
  it('returns the requested number of multiplication tasks without a model', () => {
    const plan = localTaskPlan({
      kidId: 'maja',
      topic: 'Multiplication up to 50',
      age: 8,
      questionCount: 10,
      language: 'en',
    });

    assert.equal(plan.tasks.length, 10);
    assert.equal(plan.tasks[0]?.answer, '10');
    assert.equal(plan.tasks[9]?.id, 't10');
  });

  it('offers collect, runner, and quiz battle in the kid theme', () => {
    const options = localGameOptions({
      kidIdea: 'dinosaurs in space',
      age: 8,
      plan: {
        goal: 'Multiplication up to 50',
        age: 8,
        tasks: [],
      },
    });

    assert.deepEqual(
      options.map((option) => option.template),
      ['collect', 'runner', 'quiz_battle'],
    );
    assert.match(options[0]?.pitch ?? '', /dinosaurs in space/);
  });
});
