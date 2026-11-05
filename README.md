<p align="center">
  <img
    src="brandbook/assets/banners/readme-1280x640.png"
    width="100%"
    alt="EduBotGames banner: Robo, a yellow game controller with a face and a mortarboard, next to the line Screen time is huge. Learning time isn't."
  >
</p>

<h1 align="center">EduBotGames</h1>

<p align="center">
  <b>Parents pick the topic. Kids pick the game.</b>
</p>

<p align="center">
  A kid says what game they want to play. A crew of AI agents builds it around the lesson their
  parent chose, and Robo joins the kid's team with hints, never answers.
</p>

<p align="center">
  <img
    src="https://img.shields.io/badge/Grok_Bot_Hackathon-Wroclaw,_5_Nov_2026-0A7D73?style=for-the-badge"
    alt="Grok Bot Hackathon Wroclaw, 5 Nov 2026"
  >
  <img
    src="https://img.shields.io/badge/Built_on-SpaceXAI_(Grok)_API-13283A?style=for-the-badge"
    alt="Built on the SpaceXAI (Grok) API"
  >
  <br>
  <img
    src="https://img.shields.io/badge/Track-Multiplayer_AI-FFC233?style=for-the-badge&labelColor=13283A"
    alt="Track: Multiplayer AI"
  >
  <img
    src="https://img.shields.io/badge/Track-Multi--agent_Systems-FFC233?style=for-the-badge&labelColor=13283A"
    alt="Track: Multi-agent Systems"
  >
</p>

<p align="center">
  <b>AI that teaches, not cheats.</b>
</p>

<p align="center">
  <a href="#how-it-works">How it works</a> ·
  <a href="#meet-the-crew">Crew</a> ·
  <a href="#under-the-hood-agents-on-the-grok-api">Under the hood</a> ·
  <a href="#screens">Screens</a> ·
  <a href="#why-it-wins">Why it wins</a> ·
  <a href="#demo">Demo</a> ·
  <a href="#brand">Brand</a> ·
  <a href="#getting-started">Getting started</a>
</p>

## The problem

- Kids use AI to get answers, and the learning gets skipped.
- Learning apps hand every kid the same game, and kids get bored.
- Parents and teachers can't tell whether their kid actually improved.

EduBotGames splits the job. The parent decides what to learn: the topic, the kid's age, how many
questions. The kid decides how to play it, out loud, in their own theme. A crew of AI agents turns
both into one game. Robo plays it with them and nudges with hints when they get stuck. After the
game, Lens shows the parent the score before and after, and what to practise next.

## How it works

https://github.com/user-attachments/assets/8b84e99f-d853-4711-876d-85ff2a0ca4e3

Five agents hand JSON to each other in a loop, and the kid watches the handoffs light up while the
game builds.

1. <img src="brandbook/assets/agents/prof-head.png" width="48" alt="Prof"> **The parent sets a goal.**
   "Multiplication up to 50", age 8, 10 questions. Prof, the Pedagogue, writes 10 tasks from easy to
   hard, each with one right answer and three likely mistakes.
2. <img src="brandbook/assets/agents/spark-head.png" width="48" alt="Spark"> **The kid says the game.**
   "Dinosaurs in space." Grok Voice turns the speech into text. Spark, the Game Designer, offers 2 or
   3 game types in that theme, and the kid picks one.
3. <img src="brandbook/assets/agents/doodle-head.png" width="48" alt="Doodle"> **The crew builds it.**
   Spark weaves the tasks into the game. Doodle, the Artist, paints the hero, the background and the
   items with Grok Imagine. The game engine, built by Cezary Dynak, takes the parent's inputs (topic,
   age, number of questions) and the kid's (voice idea, chosen game type) and generates a Phaser game.
4. <img src="brandbook/assets/agents/robo-head.png" width="48" alt="Robo"> **Robo plays on the kid's team.**
   A wrong answer gets a short hint. A second wrong answer gets a stronger hint. Robo never says the
   answer, and cheers when the kid gets it.
5. <img src="brandbook/assets/agents/lens-head.png" width="48" alt="Lens"> **Lens reports to the parent.**
   Accuracy before and after, per skill, the weakest skills and one next step. In the demo example,
   Maja goes from 40% to 75%.
6. <img src="brandbook/assets/agents/prof-head.png" width="48" alt="Prof"> **The loop closes.**
   Lens hands the weak skills back to Prof, who writes the next 10 tasks around them.

## Meet the crew

Robo leads. The logo and the main character share one face: a game controller in a mortarboard,
with floating mitten hands and no body. Two agents work with the parent, three play with the kid.

| | Agent | Role | Talks to | Says |
|---|---|---|---|---|
| <img src="brandbook/assets/agents/robo-head.png" width="96" alt="Robo, yellow controller head with a mortarboard"> | **Robo** | Teammate, the lead | The kid, inside the game. Sends results to Lens. | "Close! Try counting by 7s. Maja, your turn!" |
| <img src="brandbook/assets/agents/prof-head.png" width="64" alt="Prof, blue head with glasses and a pencil behind the ear"> | **Prof** | Pedagogue | The parent. Hands tasks to Spark. | "Multiplication to 50 for age 8. I made 10 tasks, easy to hard." |
| <img src="brandbook/assets/agents/spark-head.png" width="64" alt="Spark, pink head with a lightbulb antenna"> | **Spark** | Game Designer | The kid. Hands the game spec to Doodle. | "Dinosaurs in space! Catch star eggs, dodge comets or beat the space boss?" |
| <img src="brandbook/assets/agents/doodle-head.png" width="64" alt="Doodle, green head with a beret and a paintbrush"> | **Doodle** | Artist | Grok Imagine. Hands the art to the game engine. | "Painting Rex, his rocket and four shiny space rocks..." |
| <img src="brandbook/assets/agents/lens-head.png" width="64" alt="Lens, orange head with a magnifier showing a chart"> | **Lens** | Analyst | The parent. Hands weak skills back to Prof. | "Maja went from 40% to 75%. Practise 7x and 8x next." |

Every agent has four motion states for the build timeline: idle, working, handoff and done
([`brandbook/assets/agents/`](brandbook/assets/agents/),
[`agents.json`](brandbook/assets/agents/agents.json)). In the game, Robo has four poses:

| <img src="brandbook/assets/mascot/padbot-idle.png" width="120" alt="Robo idle"> | <img src="brandbook/assets/mascot/padbot-think.png" width="120" alt="Robo thinking"> | <img src="brandbook/assets/mascot/padbot-hint.png" width="120" alt="Robo giving a hint"> | <img src="brandbook/assets/mascot/padbot-cheer.png" width="120" alt="Robo cheering"> |
|:---:|:---:|:---:|:---:|
| Idle | Thinking | Hint | Cheering a right answer |

## Under the hood: agents on the Grok API

Every agent is its own server-side module with its own prompt, its own JSON schema and its own
guardrail. A plain-code orchestrator chains them and streams each step to the kid's screen, so the
handoffs light up live.

```mermaid
flowchart LR
  subgraph App["frontend/ (Next.js, browser + route handlers)"]
    UI[Parent and kid screens]
    API[Route handlers /api/agents, /api/build, /api/voice]
  end
  subgraph XAI["SpaceXAI API (key stays on the server)"]
    R[Responses API grok-4.7, structured outputs]
    I[Grok Imagine grok-imagine-image-2.0]
    S[Speech to text]
  end
  subgraph Engine["backend/ (game engine API)"]
    G[POST /api/games, GET /api/games/:id]
    DB[(Supabase: games + assets)]
  end
  UI --> API
  API --> R
  API --> I
  API --> S
  API -- parent + kid prompts --> G
  G --> DB
  G -- gameUrl --> UI
  UI -- game events, postMessage --> API
```

| Agent | Route | Grok API | In -> out | Guardrail |
|---|---|---|---|---|
| Prof, the parent's agent | `POST /api/agents/prof` | Responses API, `grok-4.7`, JSON schema | Parent's free text, age, count -> one clear goal + 10 tasks | One right answer and three likely mistakes per task, easy to hard |
| Spark, the kid's agent | `POST /api/agents/spark` | Responses API, JSON schema | Kid's idea + parent's topic -> 2-3 game types | Each option is a different template whose mechanic practises the topic |
| Doodle | `POST /api/agents/doodle/options` | Grok Imagine | Kid's theme + game type -> one scene per option | Brand style, no text, cached by theme and type |
| Robo | `POST /api/agents/robo` | Responses API, JSON schema | Task + wrong answers + players -> hint, cheer or turn | Never says the answer |
| Lens | `POST /api/agents/lens` | Responses API | Game events -> report | Accuracy is computed in code; the model only writes the summary and the next step |
| Voice | `POST /api/voice/transcribe` | Speech to text | Kid's recording -> text | Text field as a fallback |
| Orchestrator | `POST /api/build` (Server-Sent Events) | none, plain code | Plan + chosen game -> agent events, preview, game | Validates every body with zod before any call |

Why this is multi-agent and not one big prompt:

- Two agents serve two people. Prof answers the parent's question, "what does my child need to
  learn?". Spark answers the kid's, "how can this be a game?".
- Handoffs are typed. Prof's tasks go to Spark, Spark's choice goes to Doodle and to the engine,
  game events go to Lens, and Lens's weak skills go back to Prof for the next round.
- The engine gets plain-text prompts built from the agents' output, including the visual style, so
  the generated game matches the app ([docs/engine-prompts.md](docs/engine-prompts.md)).

### Measured on the live API (5 Nov 2026)

Kid's idea "unicorns on the beach", parent's text "she cannot read the clock yet", age 7.

| Step | Result | Time | Cost |
|---|---|---|---|
| Prof | Goal "Read the time on a clock", 10 tasks from full hours to quarter hours | 17.7 s | $0.0129 |
| Spark | Unicorn Clock Shells (collect), Unicorn Time Dash (runner), Beach Clock Battle (quiz battle) | 5.2 s | $0.0055 |
| Doodle | 3 scenes drawn in parallel, unicorns on a beach in the brand palette | 19.2 s | $0.12 |
| Doodle, repeat | Same scenes from the cache | 8 ms | $0 |
| Build | Preview reused from the cache, engine call done | 1.29 s | $0 |
| Speech to text | "I want a game with dinosaurs in space." | 0.68 s | about $0.0001 |
| Robo | "Super close! Start from 7 x 7, then add one more group of 7." | 5.7 s | under $0.01 |

All test rounds so far cost about $0.31 of the $60 budget.

### Status

- Live: Prof, Spark, Doodle, Robo, speech to text, the build stream, and the Phaser engine.
- One Next.js app in `backend/` serves the screens and `POST /api/games`. `frontend/` is the source
  for the screens. `npm run sync:web` copies them in before dev and build.
- Game events: the Phaser page posts answers to the app with `postMessage`
  ([docs/game-events.md](docs/game-events.md)). Lens still needs a live `XAI_API_KEY` for the written
  summary. Accuracy is computed in code.
- Login is a demo account ([tests/test-accounts.md](tests/test-accounts.md)).

Code: agents in [`frontend/lib/agents/`](frontend/lib/agents), the xAI client in
[`frontend/lib/xai/`](frontend/lib/xai), routes in [`frontend/app/api/`](frontend/app/api), the
engine API in [`backend/`](backend) with its contract in
[`packages/api-contract`](packages/api-contract).

## Screens

These are the web app screens, designed at desktop width (1440 px). Parent screens use Figtree; kid
screens use Fredoka at 18 px and up.

| | |
|:---:|:---:|
| <img src="design/web-book/img/a02-login.png" width="420" alt="Log in screen"> | <img src="design/web-book/img/p02-new-goal.png" width="420" alt="Parent screen: new goal for Maja, age 8, multiplication up to 50, 10 questions"> |
| **Log in** | **New goal.** The parent sets topic, age and number of questions. |
| <img src="design/web-book/img/p03-prof-preview.png" width="420" alt="Parent screen: Prof's 10 tasks for Maja with answers, skills and levels"> | <img src="design/web-book/img/k01-kid-home.png" width="420" alt="Kid home screen"> |
| **Prof's preview.** 10 tasks, easy to hard, editable before they go to the kid. | **Kid home** |
| <img src="design/web-book/img/k03-pick-a-game.png" width="420" alt="Kid screen: Spark offers Collect, Runner and Quiz battle for dinosaurs in space"> | <img src="design/web-book/img/k04-building.png" width="420" alt="Kid screen: the crew builds the game"> |
| **Pick a game.** Spark offers three game types in the kid's theme. | **Building.** The kid watches the crew hand off. |
| <img src="design/web-book/img/k05-game.png" width="420" alt="Game screen: question 6 times 7, players Maja, Leo and Robo, Robo's hint bubble"> | <img src="design/web-book/img/k06-win.png" width="420" alt="Kid win screen"> |
| **Game.** The Phaser canvas from the engine, with Robo's hint on the side. | **Win** |
| <img src="design/web-book/img/p04-lens-report.png" width="420" alt="Parent screen: Lens report, accuracy 40% to 75%, per-skill bars and the next step"> | <img src="design/web-book/img/k07-join.png" width="420" alt="Kid screen: join a friend with a four-letter room code, marked Adding soon"> |
| **Lens report.** Before and after, by skill, and the next step. | **Join a friend.** Adding soon, not built yet. |

## Why it wins

| Criterion | How EduBotGames hits it |
|---|---|
| Working prototype | One full path in the demo: parent goal, kid's voice, generated game, parent report. |
| Technical complexity | Five agents pass JSON in a loop (Prof, Spark, Doodle, Robo, Lens, back to Prof) across three Grok APIs: text, Grok Imagine and Grok Voice. |
| Innovation | The kid designs the game by voice. The AI is a player on the kid's side, and it only gives hints. |
| Real-world impact | Robo makes the kid do the thinking. The parent gets a before and after score per skill and one next step. |
| Theme: Multiplayer AI and Multi-agent Systems | Kids, parent and five agents work toward one learning goal. Robo is a player on the kid's team; friends joining by room code is designed and coming next. |

## Demo

The promo video is at the top of [How it works](#how-it-works). The 40% to 75% jump is example data
for the demo. Join a friend appears in the video with an "Adding soon" badge.

## Brand

<p>
  <img
    src="brandbook/assets/logo/lockup-light.png"
    width="400"
    alt="EduBotGames lockup on cream: EduBot in ink, Games in teal"
  >
  <img
    src="brandbook/assets/logo/lockup-dark.png"
    width="400"
    alt="EduBotGames lockup on teal: EduBot in white, Games in sun"
  >
</p>

**[Brand Guidelines 0.1 (PDF)](EduBotGames_Brand_Guidelines_v0.1_2026-11.pdf)** is a 38-page book:
logo, colour, type, characters and the web app flow. The HTML source is
[`brandbook/index.html`](brandbook/index.html); GitHub shows HTML as source, so open it locally or
serve the repo with GitHub Pages and open `/brandbook/`.

### Logo: PadBot

A game controller with a face, wearing a mortarboard. The tassel is the bot's antenna, so game,
school and AI teammate fit in one shape. Keep the face, the cheeks and the tassel-antenna; without
them it turns into a stock pad-and-cap icon.

### Colour: C4 Teal Lagoon

The teal ground points at the school chalkboard.

| Chip | Use |
|---|---|
| ![teal #0A7D73](https://img.shields.io/badge/teal_%230A7D73-%20-0A7D73?style=for-the-badge&labelColor=13283A) | Brand ground, primary buttons. White text on it (5.01:1). |
| ![ink #13283A](https://img.shields.io/badge/ink_%2313283A-%20-13283A?style=for-the-badge&labelColor=13283A) | Outlines, text, hard shadows. |
| ![sun #FFC233](https://img.shields.io/badge/sun_%23FFC233-%20-FFC233?style=for-the-badge&labelColor=13283A) | PadBot head, chips, stars. Ink text only (9.35:1). |
| ![tangerine #FF8A3D](https://img.shields.io/badge/tangerine_%23FF8A3D-%20-FF8A3D?style=for-the-badge&labelColor=13283A) | Highlights. |
| ![pink #FF6FA5](https://img.shields.io/badge/pink_%23FF6FA5-%20-FF6FA5?style=for-the-badge&labelColor=13283A) | Tassel, sparkles, confetti. |
| ![cap blue #3A6186](https://img.shields.io/badge/cap_blue_%233A6186-%20-3A6186?style=for-the-badge&labelColor=13283A) | Mortarboard, lighter than ink so its outline stays visible. |
| ![cheek #FFB3C7](https://img.shields.io/badge/cheek_%23FFB3C7-%20-FFB3C7?style=for-the-badge&labelColor=13283A) | Cheeks, confetti. |
| ![cream #F3FBF9](https://img.shields.io/badge/cream_%23F3FBF9-%20-F3FBF9?style=for-the-badge&labelColor=13283A) | Page background. |

White text goes on teal only. Sun, tangerine and pink never carry white text.

### Type and style

- [Fredoka](https://fonts.google.com/specimen/Fredoka) 600 for the wordmark, headings, buttons and
  kid text (18 px minimum). [Figtree](https://fonts.google.com/specimen/Figtree) for UI and parent
  text.
- Flat fills only, thick ink outlines and a hard offset ink shadow (`5px 6px 0 #13283A`) instead of
  gradients or blur.
- Buttons at least 56 px tall, radius 20 to 28. Motion respects `prefers-reduced-motion`.

### Files

[`brandbook/assets/`](brandbook/assets/) holds the logo, banners, mascot, agents and tokens, each as
SVG and PNG. Design tokens live in
[`tokens.css`](brandbook/assets/tokens/tokens.css) and [`tokens.json`](brandbook/assets/tokens/tokens.json),
and the app uses only these. Logo masters with outlined type are in
[`brandbook/img/logo/`](brandbook/img/logo/). Every brand call, kept or rejected, is in
[`decisions.md`](brandbook/decisions.md).

| Banner | Size | Use |
|---|---|---|
| [`cover-1920x1080`](brandbook/assets/banners/cover-1920x1080.png) | 1920 x 1080 | Pitch title slide, hackathon submission |
| [`vertical-1080x1920`](brandbook/assets/banners/vertical-1080x1920.png) | 1080 x 1920 | Open and end card of the promo video |
| [`readme-1280x640`](brandbook/assets/banners/readme-1280x640.png) | 1280 x 640 | README, GitHub social preview, og:image |
| [`splash-390x844`](brandbook/assets/banners/splash-390x844.png) | 390 x 844 | App splash screen |

## Tech stack

| Layer | Choice |
|---|---|
| App | Next.js web app in the browser |
| Games | Phaser, generated by the game engine from the parent's and the kid's inputs |
| Agents | SpaceXAI (Grok) API, `grok-4.7`, JSON output only |
| Art | Grok Imagine for heroes, backgrounds and items |
| Speech | Grok Voice for the kid's speech, with a text field as fallback |
| Design | Brand tokens from `brandbook/assets/tokens/` |

```mermaid
flowchart LR
  Parent([Parent goal]) --> Prof
  Kid([Kid's idea]) --> Spark
  Prof -- tasks --> Spark
  Spark -- game spec --> Doodle
  Doodle -- art --> Engine[Game engine]
  Engine -- Phaser game --> Robo
  Robo -- session results --> Lens
  Lens -- report --> ParentPanel([Parent panel])
  Lens -- weak skills --> Prof
```

## Project structure

```text
frontend/       source for the screens and the kid/parent agents (copied into backend before build)
backend/        the app you deploy: screens, agents, games API, Phaser host (Next.js)
packages/       shared API contract (zod)
specs/          product spec, agents and prompts, design brief, API, app flow, pitch, video script
brandbook/      Brand Guidelines (index.html), assets, tokens, decisions, build scripts in _src/
design/
  web-book/     the web app screens, desktop 1440 wide (the current product)
  mobile-book/  14 phone screens for a future mobile version
AGENTS.md       notes for coding agents
```

Start with the specs:
[product](specs/01-product-spec.md) ·
[agents](specs/02-agents.md) ·
[design brief](specs/03-design-brief.md) ·
[API](specs/04-api.md) ·
[app flow](specs/05-app-flow.md) ·
[impact measurement](specs/08-impact-measurement.md)

## Getting started

Needs Node 22 or newer. Put secrets in `.env` (see `.env.example`). Never commit that file.

```bash
npm install
./run.sh
```

Open http://127.0.0.1:3001 and log in with the demo account in
[tests/test-accounts.md](tests/test-accounts.md). With no `XAI_API_KEY`, Prof and Spark use a local
lesson and the engine draws a shape game. A live key turns on Grok text, Imagine, and speech.

`./run.sh` installs the workspaces when `node_modules` is missing and copies `.env` to
`backend/.env.local` when that file is missing.

With that server up, this walks health, a generated game, and the screens from login through play:

```bash
SMOKE_BASE_URL=http://127.0.0.1:3001 npm run smoke --workspace @grok-hack/api
```

To work on the screens alone, against the API on port 3001:

```bash
npm run dev:api
npm run dev:web
```

`frontend/.env.local` needs `API_BASE_URL=http://127.0.0.1:3001`. Set `NEXT_PUBLIC_FLOW_MOCK=1`
there to run the screens on demo data without any API calls.

## Deploy

Production is one Vercel project. The GitHub app cannot see this org, so deploy with the CLI.
The upload root is `backend/`. Do not push this branch to `main`, and do not merge it, until you
have tried the preview.

```bash
npm install
npm run sync:web
cd backend
npx vercel link --yes --project grok-hack-wro
npx vercel deploy --prod --yes
```

`npm run build` inside `backend/` vendors `packages/api-contract` and, when `../frontend` is
present, refreshes the UI copy. A backend-only upload uses the copy already in the repo.
`/api/games`, `/api/health`, `/play/{uuid}`, and `/phaser/runtime.js` stay on this app. Kid screens
are `/play`, `/play/pick`, `/play/building`, `/play/game`, and `/play/win`.

Set these in the Vercel project. Do not commit the values.

| Name | Required | Purpose |
| --- | --- | --- |
| `XAI_API_KEY` | for live agents and drawn art | Without it, local lessons and shape art |
| `XAI_MODEL` | no | Default `grok-4.7` |
| `XAI_IMAGE_MODEL` | no | App default `grok-imagine-image-2.0`. Engine default `grok-imagine-image` |
| `XAI_STT_MODEL` | no | Speech. Default `grok-voice-transcribe-2.0` |
| `XAI_REASONING_EFFORT` | no | Engine default `low` |
| `SUPABASE_URL` | for production games | Server only. Do not use a `NEXT_PUBLIC_` prefix |
| `SUPABASE_SERVICE_ROLE_KEY` | with the URL | Bypasses RLS |
| `PUBLIC_BASE_URL` | yes on Vercel | `https://grok-hack-wro.vercel.app`. Used in `gameUrl` |
| `API_BASE_URL` | no | Leave unset here. The app calls the engine in-process |
| `CORS_ORIGINS` | no | Extra browser origins. Same-origin pages do not need it |
| `GAME_STORE` | no | `memory` forces the process-local store |

Apply `supabase/migrations` before the first production game. `GET /api/health` reports
`storage: supabase` when the keys are set.

Rebuild the brand assets:

```bash
python3 brandbook/_src/export.py
python3 brandbook/_src/export_agents.py
python3 brandbook/_src/book_masters.py
uv run --with playwright python brandbook/_src/svg2png.py "$PWD/brandbook/assets"
```

## Team and credits

- Concept: Cezary Dynak (backend, engine) and Bart Szczepanski (frontend, agents)
- Design and brand: Bart Szczepanski
- Built at Grok Bot Hackathon Wroclaw, 5 Nov 2026, on the SpaceXAI (Grok) API
- Fonts: Fredoka and Figtree from Google Fonts
