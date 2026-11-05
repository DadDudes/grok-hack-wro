# Prompts the frontend sends to the game engine

`POST /api/games` accepts `parentPrompt`, `childPrompt`, `childAge` and `language`, plus optional
`questionCount`, `template` (`collect`, `runner`, `quiz`, or `quiz_battle`) and `tasks`
(see [api-contract.md](./api-contract.md)). The app sends those structured fields and also keeps
the same facts in the two prompts, one per line, so an older client still works. Structured fields
win when both are present. `quiz_battle` is played as the `quiz` template.

## `parentPrompt`: what to learn

Built from the parent's goal and Prof's task plan.

```text
Learning goal: Multiplication up to 50
Kid age: 8
Questions: 10
Language: en
Tasks (question | answer | wrong answers | difficulty | skill):
t1. 2 x 5 = ? | 10 | 7, 12, 25 | 1 | 2x 5x 10x
t2. 3 x 4 = ? | 12 | 7, 14, 9 | 1 | 3x 4x
t3. 6 x 7 = ? | 42 | 36, 48, 13 | 2 | 7x table
```

- Every task has an id (`t1` ... `t10`). The game sends it back in its events
  ([game-events.md](./game-events.md)).
- Exactly one right answer and three wrong ones per task. Difficulty runs from 1 to 3, easy to hard.

## `childPrompt`: how to play and how it looks

Built from the kid's idea (voice transcript) and the game type the kid picked from Spark's options.

```text
Kid's idea: dinosaurs in space
Game type: collect
Game title: Collect
Pitch: Fly Rex around and catch the star egg with the right answer.
Visual style: EduBotGames brand. Flat fills, thick dark ink outlines (#13283A), hard offset shadows,
no gradients, no blur. Palette: teal #0A7D73, sun #FFC233, tangerine #FF8A3D, pink #FF6FA5,
cream #F3FBF9. Rounded font Fredoka. Cute and kid-friendly, no text inside images.
Events: post every answer and the finish to the parent page as described in game-events.md.
```

- `Game type` is one of the engine templates `collect`, `runner`, `quiz` (Spark's `quiz_battle` maps to `quiz`).
- The `Visual style` line keeps the generated game in line with the app design
  (`design/web-book/`, `brandbook/assets/tokens/`).

Both prompts stay under the 4000-character limit: ten tasks take about 800 characters.
