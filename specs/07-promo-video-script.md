# EduBotGames - promo video script (standalone for judges, 30-45 s, 9:16)

Judges watch this WITHOUT a presenter. On-screen captions carry the story. Name the track in the first seconds. Show agents working (S2 timeline). End-to-end app flow.

**TEXT ONLY draft.** Do not generate footage, Remotion, or clips from this file yet. Record real app screens later. If polish clips are generated later, use the xAI API: **Grok Imagine video**, including **reference-to-video** from real app screenshots and/or the Robo mascot asset.

Format: vertical 9:16. Target **40 s** (band 30-45 s). Mascot: Robo on every shot.

## Palette reminder
- `#6C4DF6` purple · `#FFC93C` yellow · `#2ED3A0` mint · `#FF6B6B` coral · `#1E1B3A` ink · cream `#FFF8EC`

## Music mood
Upbeat playful chiptune-pop, no lyrics, ~110 BPM. Soft win sting on the parent delta. Music under captions/VO by ~6 dB.

## Language
Captions carry the story (judges may watch muted). Provide PL and EN caption tracks + optional VO takes. Default for Wrocław: PL captions on screen, EN as alternate track.

## Source policy (Recorded vs Generated vs Hybrid)
- **Recorded:** real app UI. Prefer for flow and credibility (S1-S4, timeline, hints, delta).
- **Generated:** grok-imagine video. Use only for polish the live app cannot show (stylized Robo intro, agent handoff metaphor, end-card flourish).
- **Hybrid:** recorded UI plate + generated motion overlay, or reference-to-video using a real screenshot / Robo PNG as the reference image.
- Prefer Recorded. Generate sparingly.

When generating later: model family = Grok Imagine video (see 04-api.md reference-to-video). Pass a reference image when noted. English prompts below are ready to paste.

---

## Shot list

| # | Time | Dur | Source | App screen / asset | On-screen captions EN / PL | VO EN | VO PL |
|---|---|---|---|---|---|---|---|
| 1 | 0:00-0:04 | 4 s | **Hybrid** | Generated Robo intro over cream bg + burned-in track badge; optional cut to Recorded S0 `/` | EN: `EduBotGames` · `TRACK: Multi-agent + Multiplayer AI` / PL: `EduBotGames` · `TRACK: Multi-agent + Multiplayer AI` | "EduBotGames. Multi-agent. Multiplayer AI." | "EduBotGames. Multi-agent. Multiplayer AI." |
| 2 | 0:04-0:09 | 5 s | **Recorded** | S1 `/parent` - pick Ola 8, chip Tabliczka mnożenia / type mnożenie do 50, tap Stwórz grę | EN: `Parent sets the goal` / PL: `Rodzic ustawia cel` | "Parent sets a goal. Multiplication to fifty." | "Rodzic ustawia cel. Mnożenie do pięćdziesięciu." |
| 3 | 0:09-0:15 | 6 s | **Recorded** | S2 `/play/[sessionId]` - mic hold, transcript bubble `dinozaury w kosmosie`, tap Gotowe! | EN: `Kid designs by voice` / PL: `Dziecko projektuje głosem` | "Kid designs by voice. Dinosaurs in space!" | "Dziecko projektuje głosem. Dinozaury w kosmosie!" |
| 4 | 0:15-0:23 | 8 s | **Hybrid** | Recorded S2 AgentTimeline (Pedagogue → Designer → Artist → Ready) as plate; optional Generated handoff flourish layered | EN: `5 Grok agents build the game` / PL: `5 agentów Grok buduje grę` | "Five Grok agents. Tasks, game, sprites. Ready." | "Pięć agentów Grok. Zadania, gra, grafiki. Gotowe." |
| 5 | 0:23-0:30 | 7 s | **Recorded** | S3 `/game/[gameId]` Collect - wrong item → Robo hint bubble; correct → cheer; show avatars + score | EN: `Robo hints, never answers` / PL: `Robo podpowiada, nie zdradza` | "Robo plays along. Hints, not answers." | "Robo gra razem. Podpowiedzi, nie odpowiedzi." |
| 6 | 0:30-0:34 | 4 s | **Recorded** | S3 room code pill + S3b `/join` second phone (stretch). If join not built: skip, add 2 s to shot 5 and 2 s to shot 7 | EN: `Friends join the room` / PL: `Znajomi dołączają do pokoju` | "Friends join with a code." | "Znajomi dołączają z kodem." |
| 7 | 0:34-0:40 | 6 s | **Hybrid** | Recorded S4 `/report/[kidId]` DeltaCard 40% → 75% as plate; Generated end flourish + tagline card | EN: `40% → 75%` then `AI that teaches, not cheats` / PL: `40% → 75%` then `AI które uczy, nie ściąga` | "Parents see the progress. AI that teaches, not cheats." | "Rodzic widzi postęp. AI które uczy, nie ściąga." |

**Total: 40 s.** Trim to 30 s: drop shot 6, shorten shot 4 to 5 s and shot 5 to 5 s. Extend to 45 s: hold Ready confetti +2 s, end card +3 s.

---

## Per-shot generation notes (only if/when generating later)

### Shot 1 - Hybrid (Generated lead)
- **Reference image:** Robo idle PNG (from design export / `components` asset once exported). Path TBD, e.g. `/public/robo/idle.png`.
- **Ready English prompt (grok-imagine video / reference-to-video):**
  > Cute flat 2D robot mascot Robo with a round head, screen face with big eyes, one antenna, idle then a small cheerful wave, cream background #FFF8EC, bold outlines, kid-friendly game UI style, soft purple #6C4DF6 glow, no text in the video frame, vertical 9:16, 4 seconds.
- Burn track badge and title as **post captions** in the editor (do not ask the video model to render readable UI text).

### Shot 4 - Hybrid (Recorded plate + optional Generated flourish)
- **Primary:** record real S2 timeline. Speed-ramp if pipeline > 8 s so Ready lands by 0:23.
- **Optional Generated overlay** only if timeline alone feels flat. **Reference image:** screenshot of S2 building state once captured, e.g. `/captures/s2-timeline.png`.
- **Ready English prompt:**
  > Soft motion graphics of five glowing agent chips handing a glowing JSON node left to right (Pedagogue to Designer to Artist to Ready), flat 2D, palette purple #6C4DF6 yellow #FFC93C mint #2ED3A0 coral #FF6B6B on cream #FFF8EC, bold outlines, no readable letters, vertical 9:16, 3 seconds, transparent-friendly for overlay on a UI recording.
- Prefer keeping chip labels from the **Recorded** UI, not from generation.

### Shot 7 - Hybrid (Recorded plate + Generated flourish)
- **Primary:** record real S4 DeltaCard.
- **Generated end card flourish** after or over the last 2 s. **Reference image:** Robo cheer PNG, e.g. `/public/robo/cheer.png`, and/or S4 screenshot `/captures/s4-delta.png`.
- **Ready English prompt:**
  > Robo the cute flat 2D robot mascot cheering with both arms up, confetti in purple #6C4DF6 yellow #FFC93C mint #2ED3A0, cream background #FFF8EC, bold outlines, joyful, no text in frame, vertical 9:16, 2 seconds.
- Burn tagline captions in the editor: `AI that teaches, not cheats` / `AI które uczy, nie ściąga`.

### Shots 2, 3, 5, 6 - Recorded only
No generation. Capture from live app or `/game/demo` + seed if API is down.

---

## Full caption / VO takes (~40 s)

### English captions (muted-safe story)
1. EduBotGames · TRACK: Multi-agent + Multiplayer AI
2. Parent sets the goal
3. Kid designs by voice
4. 5 Grok agents build the game
5. Robo hints, never answers
6. Friends join the room
7. 40% → 75% · AI that teaches, not cheats

### English VO
"EduBotGames. Multi-agent. Multiplayer AI. Parent sets a goal. Multiplication to fifty. Kid designs by voice. Dinosaurs in space! Five Grok agents. Tasks, game, sprites. Ready. Robo plays along. Hints, not answers. Friends join with a code. Parents see the progress. AI that teaches, not cheats."

### Polish captions
1. EduBotGames · TRACK: Multi-agent + Multiplayer AI
2. Rodzic ustawia cel
3. Dziecko projektuje głosem
4. 5 agentów Grok buduje grę
5. Robo podpowiada, nie zdradza
6. Znajomi dołączają do pokoju
7. 40% → 75% · AI które uczy, nie ściąga

### Polish VO
"EduBotGames. Multi-agent. Multiplayer AI. Rodzic ustawia cel. Mnożenie do pięćdziesięciu. Dziecko projektuje głosem. Dinozaury w kosmosie! Pięć agentów Grok. Zadania, gra, grafiki. Gotowe. Robo gra razem. Podpowiedzi, nie odpowiedzi. Znajomi dołączają z kodem. Rodzic widzi postęp. AI które uczy, nie ściąga."

---

## Real app screens to record later (checklist)

1. `/` S0 - optional support for shot 1 cutaway
2. `/parent` S1 - Ola selected, goal chip, Stwórz grę
3. `/play/[sessionId]` S2 - idle, recording/confirm, **building timeline** (critical), ready
4. `/game/[gameId]` S3 - wrong then right answer, Robo bubble, room code
5. `/join` S3b - only if multiplayer built
6. `/report/[kidId]` S4 - DeltaCard 40% → 75%
7. Robo assets: idle, thinking, hint, cheer (for Hybrid reference-to-video)

Fallback while filming: `/game/demo` + seeded report (`lib/seed.ts`).

Capture at 390×844 or phone vertical. Hard cuts. Captions large, cream/yellow fill, ink outline, bottom-safe.

---

## Judging map (what each shot sells)

| Shot | Criteria |
|---|---|
| 1 Track + title | Theme Alignment |
| 2 Parent goal | Real-World Impact, Theme Alignment |
| 3 Kid voice | Innovation, Working Prototype |
| 4 Agent timeline | Technical Complexity, Theme Alignment, Working Prototype |
| 5 Robo hints | Innovation, Working Prototype |
| 6 Friends join | Theme Alignment (Multiplayer AI) |
| 7 Parent delta + tagline | Real-World Impact, Innovation |

If forced to 30 s, keep 1-5 and 7. Drop 6 first.

---

## Flags (assumptions)

- Shot 6 (friends join) is stretch per 05-app-flow.md. Optional in the edit.
- Robo live voice is stretch; this cut shows on-screen hint bubbles only.
- Drawing-photo stretch is not in this cut.
- Pipeline target in app is < 25 s; video compresses shot 4 to ~8 s with speed-ramp. Live product copy may still say "about 30 seconds".
- Generated clips are optional polish. Credibility rests on Recorded UI. Do not generate fake agent chips that disagree with the real S2 timeline.
- Reference image paths (`/public/robo/...`, `/captures/...`) are placeholders until design export and screen captures exist.
- Tagline matches 01-product-spec.md: "AI that teaches, not cheats" / "AI które uczy, nie ściąga".
- Grok Imagine video / reference-to-video is listed in 04-api.md as stretch/pre-record; using it here is post-MVP polish for the submitted video, not a claim that video gen runs inside the product MVP.
