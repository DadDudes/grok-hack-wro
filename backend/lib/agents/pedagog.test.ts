import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { answersMissTarget, learningLanguageName } from './pedagog.ts';

describe('learningLanguageName', () => {
  it('treats an English-vocabulary goal as English answers, not Polish UI copy', () => {
    assert.equal(
      learningLanguageName('naucz mojego syna nazw części ciała po angielsku'),
      'English',
    );
    assert.equal(learningLanguageName('tabliczka mnożenia do 50'), null);
  });

  it('rejects Polish body-part answers when the target is English', () => {
    assert.equal(
      answersMissTarget(
        [{ answer: 'stopa', distractors: ['dłoń', 'broda'] }],
        'English',
      ),
      true,
    );
    assert.equal(
      answersMissTarget(
        [{ answer: 'foot', distractors: ['hand', 'knee'] }],
        'English',
      ),
      false,
    );
  });
});
