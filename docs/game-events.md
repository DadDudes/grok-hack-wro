# Game events (proposal for the engine)

The frontend shows the generated game in an iframe at `gameUrl`. Robo's hints and Lens's report need
to know what the kid answered. This proposal adds no API route: the game posts messages to the page
that embeds it.

Status: proposal from the frontend. Until the engine sends these events, the frontend uses demo data.

## From the game to the app

The game calls `window.parent.postMessage(event, '*')` for every answer and once at the end.

```ts
type GameEvent = {
  source: 'edubotgames-game';
  type: 'answer' | 'finish';
  taskId: string | null;
  answer: string | null;
  correct: boolean | null;
  player: string | null;
  at: string;
};
```

| Field | Notes |
| --- | --- |
| `source` | Always `edubotgames-game`, so the app can ignore other messages. |
| `type` | `answer` after each pick, `finish` when the game ends. |
| `taskId` | The id of the task from the game spec (`t1` ... `t10`). Null on `finish`. |
| `answer` | What the kid picked, as text. Null on `finish`. |
| `correct` | Whether it was the right answer. Null on `finish`. |
| `player` | Player name when several kids play, otherwise null. |
| `at` | ISO 8601 time. |

## From the app to the game (optional)

The app may send `{ source: 'edubotgames-app', type: 'hint', text }` so the game can show Robo's hint
inside the canvas. The game may ignore it; the app also shows the hint beside the iframe.

## What the engine needs from the request

To fill `taskId`, the engine needs the task list. Today `POST /api/games` takes `parentPrompt` and
`childPrompt` only. The frontend sends the tasks inside `parentPrompt` as JSON after the goal, until
the contract gets a `tasks` field.
