# EduBotGames - app flow spec (Next.js)

Read with: 01-product-spec.md (what), 02-agents.md (agent prompts), 03-design-brief.md (look), 04-api.md (SpaceXAI API).
Goal: an implementing agent can build every screen and route from this file alone.

## Stack
- Next.js 15, App Router, TypeScript, Tailwind
- Phaser 3 loaded client-side only (`dynamic(() => import(...), { ssr: false })`)
- SpaceXAI API called ONLY from server (Route Handlers in `app/api/*`), key in `XAI_API_KEY` (.env.local)
- OpenAI SDK with `baseURL: "https://api.x.ai/v1"` (or `@ai-sdk/xai`)
- State: in-memory store on server (`lib/store.ts`, a Map) for the hackathon. No DB. Optional: JSON file persistence.
- Realtime to client: Server-Sent Events (SSE) for the agent timeline and multiplayer room updates
- Zod schemas shared by API and UI (`lib/schemas.ts`), the same schemas go to Structured Outputs

## Folder structure
```
app/
  page.tsx                      # S0 Landing / role pick
  parent/page.tsx               # S1 Parent setup
  play/[sessionId]/page.tsx     # S2 Kid prompt + agent timeline
  game/[gameId]/page.tsx        # S3 Game (Phaser) + Robo
  join/page.tsx                 # S3b Join room by code
  report/[kidId]/page.tsx       # S4 Parent panel
  api/
    session/route.ts            # POST create session (parent goal)
    transcribe/route.ts         # POST audio -> text (Grok STT)
    generate/route.ts           # POST start pipeline -> returns gameId
    events/[sessionId]/route.ts # GET SSE agent timeline
    asset/route.ts              # POST image gen (Artist), cached
    hint/route.ts               # POST Teammate hint
    answer/route.ts             # POST record answer
    finish/route.ts             # POST end game -> Analyst
    room/[code]/route.ts        # GET state / POST join (multiplayer)
    room/[code]/events/route.ts # GET SSE room updates
    report/[kidId]/route.ts     # GET latest report
components/
  Robo.tsx                      # mascot, props: pose = idle|thinking|hint|cheer, text?
  AgentTimeline.tsx             # 4 chips + live status
  MicButton.tsx                 # hold to talk, MediaRecorder
  GameCanvas.tsx                # Phaser wrapper (client only)
  ScoreBar.tsx, PlayerAvatars.tsx, SkillBars.tsx, DeltaCard.tsx
lib/
  xai.ts                        # client, model constants
  agents/pedagogue.ts, designer.ts, artist.ts, teammate.ts, analyst.ts
  orchestrator.ts               # runs pipeline, emits events
  store.ts, schemas.ts, seed.ts
game/
  scenes/CollectScene.ts        # MVP template
  scenes/RunnerScene.ts, QuizBattleScene.ts (stretch)
  loadSpec.ts                   # GameSpec -> Phaser config
```

## Core data model (lib/schemas.ts)
```ts
Kid        { id, name, age, avatarColor }
Session    { id, kidId, goal, language: "pl"|"en", createdAt }
Task       { id, question, answer, distractors[3], difficulty 1|2|3, skill }
TaskSet    { goal, age, tasks: Task[] }
GameSpec   { id, sessionId, template: "collect"|"runner"|"quiz_battle", title, theme,
             introLine, hero: { name, spritePrompt, url? }, backgroundPrompt, backgroundUrl?,
             itemPrompts[], itemUrls[], rules, tasks: Task[], roomCode }
AgentEvent { sessionId, agent: "pedagogue"|"designer"|"artist"|"ready"|"error",
             status: "start"|"done"|"error", message, at }
Answer     { gameId, playerId, taskId, chosen, correct, hintsUsed, ms }
Room       { code (4 letters), gameId, players: {id,name,color}[], score, currentTaskIdx }
Report     { kidId, accuracyBefore, accuracyNow, delta, bySkill[{skill,before,now}],
             weakSkills[], parentSummary, pedagogueFeedback }
```

## Happy path (demo script = test script)
1. S0 -> "I'm a parent" -> S1
2. S1 parent picks kid "Ola, 8", goal "mnożenie do 50" -> POST /api/session -> { sessionId } -> redirect /play/[sessionId]
3. S2 kid holds mic, says "dinozaury w kosmosie" -> POST /api/transcribe -> text shown in bubble -> kid taps "Gotowe!" -> POST /api/generate
4. S2 timeline over SSE: Pedagogue start/done -> Designer start/done -> Artist start/done -> Ready (target < 25 s total)
5. Ready -> redirect /game/[gameId]; room code shown ("Zaproś kolegę: KQZT")
6. Friend on second phone opens /join, types KQZT -> joins, avatar appears for both
7. S3 players collect the correct answers; wrong answer -> POST /api/hint -> Robo bubble; correct -> cheer + team score
8. After last task -> POST /api/finish -> Analyst -> redirect kids to "Brawo!" end card, parent to /report/[kidId]
9. S4 shows 40% -> 75% (before comes from seeded session in lib/seed.ts), skill bars, weak skill, next step, "Zagraj znowu" (starts new session with pedagogueFeedback)

## Screens

### S0 Landing `/`
- Robo idle, logo EduBotGames, two big buttons: "Jestem rodzicem / nauczycielem" -> /parent, "Dołącz do gry" -> /join
- No auth. Kid list kept in localStorage (`ebg.kids`).

### S1 Parent setup `/parent`
- Kid picker: existing kids (chips) + "Dodaj dziecko" (name, age slider 6-12)
- Goal input with suggestion chips: Tabliczka mnożenia, Dodawanie do 100, Ortografia ó/u, Angielskie zwierzęta, Zegar
- Language toggle PL/EN
- Number of questions: 5 / 10 (default 10)
- CTA "Stwórz grę" -> POST /api/session {kidId, goal, language, count} -> /play/[sessionId]
- Validation: goal 3-120 chars. Disabled CTA until kid + goal.

### S2 Kid prompt + timeline `/play/[sessionId]`
States:
- `idle`: Robo idle, title "W co chcesz zagrać?", giant MicButton, small text field fallback "albo napisz"
- `recording`: pulsing mic, waveform, release to stop (max 15 s)
- `transcribing`: Robo thinking, spinner
- `confirm`: bubble with kid text, buttons "Gotowe!" and "Jeszcze raz"
- `building`: AgentTimeline visible, Robo thinking, each chip lights up on SSE event, shows short message from agent (e.g. Designer: "Robię grę o dinozaurach w kosmosie!")
- `ready`: confetti, "Gra gotowa!" -> auto redirect after 1.5 s
- `error`: Robo sad line + "Spróbuj jeszcze raz" (retry POST /api/generate)
Stretch: "Zrób zdjęcie rysunku" button -> photo goes with the prompt to Designer (image understanding) and Artist (image edit to sprite).

### S3 Game `/game/[gameId]`
- Top bar: PlayerAvatars (kids + Robo), team score, task progress "3/10"
- Center: GameCanvas (Phaser) fills width, 9:16 friendly
- Bottom-left: Robo with speech bubble (hint/cheer), auto-hide after 4 s
- Room code pill (tap to copy / show QR)
- Client events from Phaser to React via a tiny event bus (`game.events.emit('answer', {...})`)
- On answer: POST /api/answer; if wrong -> POST /api/hint {gameId, taskId, wrongAnswers, players} -> show hint; 2nd wrong -> stronger hint
- Multiplayer: both clients subscribe to /api/room/[code]/events; server is source of truth for score and currentTaskIdx; Teammate may set `next_player` -> highlight that avatar ("Teraz Kuba!")
- End: POST /api/finish -> end card "Brawo! 8/10" with Robo cheer

### S3b Join `/join`
- 4-letter code input (big boxes), name input, color pick -> POST /api/room/[code] -> /game/[gameId]

### S4 Parent panel `/report/[kidId]`
- DeltaCard: big "40% -> 75%" with +35 pp badge
- SkillBars: before/after per skill
- "Do poćwiczenia": weakSkills chips
- parentSummary (2 sentences)
- Session list (date, goal, score)
- CTA "Zagraj znowu" -> POST /api/session with same goal + pedagogueFeedback -> /play/[newSessionId]
- Desktop layout 2 columns, mobile 1 column
- Stretch: "Koszt tej gry: $0.03" from cost tracking

## Orchestrator (lib/orchestrator.ts)
```
runPipeline(sessionId, kidPrompt, photo?):
  emit(pedagogue,start) -> TaskSet = pedagogue(goal, age, lastReport?)   -> emit(done, "10 zadań gotowe")
  emit(designer,start)  -> GameSpec = designer(kidPrompt, TaskSet, photo?) -> emit(done, spec.title)
  emit(artist,start)    -> urls = artist(spec)  (parallel image calls, theme cache) -> emit(done)
  store game, create room code -> emit(ready, gameId)
  on any error: emit(error, msg); fallback to cached demo game "dino-space"
```
- All agent calls: Responses API, model grok-4.7, Structured Outputs with the Zod schema converted to JSON schema
- Timeouts: 20 s per agent, 1 retry
- Artist fallback: placeholder sprites in /public/fallback if images fail

## Fallbacks (demo must never break)
- No mic permission -> text field
- STT fails -> text field prefilled with "dinozaury w kosmosie"
- Image gen slow -> show game with fallback sprites, swap when ready
- API down -> /game/demo loads pre-generated spec from lib/seed.ts
- Seeded data: kid "Ola, 8", one past session at 40% for the delta

## Non-functional
- Mobile first 390x844, touch targets >= 56 px
- Kid screens: max 6 words per label, icons + Robo voice optional
- No API key in client bundle; check with `grep -r XAI_API_KEY .next/static` before demo
- Moderation on kid prompt before pipeline (see 04-api.md)

## Build order (fits the sprint)
1. Scaffold Next.js + Tailwind + schemas + store + seed (15 min)
2. Orchestrator + 3 pre-game agents with structured outputs, test via curl (40 min)
3. S1, S2 with timeline SSE (30 min)
4. CollectScene in Phaser from GameSpec + S3 single player + hints (45 min)
5. Analyst + S4 (20 min)
6. Multiplayer room + join (stretch, 20 min)
7. Record 30-45 s video (last 15 min)
