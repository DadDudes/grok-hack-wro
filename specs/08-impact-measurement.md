# EduBotGames - measuring real learning gain (for judges, esp. data science)

Goal: show with numbers that a kid learns more with EduBotGames than with the same tasks on a plain worksheet. Not just "kids like it".

## 1. Core design: pre-test, play, post-test, with a control
- Pre-test: 5 items from the parent's goal (e.g. multiplication 6-9), no hints, timed.
- Intervention: 3-5 min in the generated game (same skill, different items).
- Post-test: 5 NEW items of the same difficulty (parallel form A/B, randomly assigned which form is pre and which is post, so the test itself is not the effect).
- Control group: same pre/post, but the middle 3-5 min is a plain worksheet with the same number of items. This isolates the game + agents effect from "just practice".
- Optional retention check: same post-test format again next day (parent panel triggers it).

## 2. Metrics (all logged automatically as events)
| Metric | Formula | Why |
|---|---|---|
| Accuracy pre/post | correct / total | basic result |
| Normalized gain (Hake g) | (post - pre) / (100 - pre) | fair across kids who start high or low |
| Speed | median seconds per correct answer | fluency, not only correctness |
| Hint dependence | hints used per item, trend over session | Robo should fade out, not do the work |
| Effect size | Cohen's d of gain, game vs control | the number a data scientist trusts |
| Engagement | voluntary extra rounds, time on task | learning only happens if they play |
| Retention | next-day score / post score | did it stick |

## 3. What the Analyst agent does
- Reads the event log (Answer events with itemId, correct, ms, hintsUsed, phase pre|play|post|retention).
- Computes the metrics above in code (deterministic, not LLM math). Option: grok code_execution tool so the agent shows its calculation.
- Writes a parent summary in plain words plus a "confidence" note (small sample = say so).
- Parent panel S4 shows: pre vs post bar, gain g, speed change, hint fade curve, and the control comparison when available.

## 4. Data model additions
- Answer: add `phase: "pre" | "play" | "post" | "retention"`, `form: "A" | "B"`, `hintsUsed`, `ms`.
- Session: add `condition: "game" | "control"`.
- Report: add `gainG`, `medianMsPre`, `medianMsPost`, `hintTrend`, `cohenD?`, `n`.

## 5. Real data tonight (mini pilot at the hackathon)
We cannot test on kids in 3 h, but we can get REAL numbers instead of seeded ones:
- Use an adult-level skill on the same pipeline (e.g. hard mental math 13x17 or a quick Polish geography quiz).
- Ask 6-10 people at the venue: half game, half worksheet (coin flip). Each run takes about 5 min.
- Show the real table + gain + effect size in the deck and video, labeled honestly: "pilot, n=8, adults, 5 min".
- Keep the seeded "Ola 40%" kid profile only for the UI demo, clearly labeled as example data.

## 6. Pitch line for judges
"We don't claim kids love it, we measure it: pre-test, play, post-test, against a worksheet control. Normalized gain, speed and hint fade, computed per kid, shown to the parent."

## 7. Roadmap beyond the hackathon
- A/B at scale across many families, mastery tracking per skill (Bayesian knowledge tracing), spaced repetition for retention.
- Align item bank with podstawa programowa so gains map to school curriculum.
