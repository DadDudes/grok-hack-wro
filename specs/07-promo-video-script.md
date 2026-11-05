# EduBotGames - promo video script (standalone for judges, 30-45 s, 9:16)

Judges watch this WITHOUT a presenter. On-screen captions carry the story. Name the track in the first seconds. Show agents working (K-04 Building timeline). End-to-end app flow.

**TEXT ONLY draft.** Do not generate footage, Remotion, or clips from this file yet. Record real app screens later. If polish clips are generated later, use the xAI API: **Grok Imagine video**, including **reference-to-video** from real app screenshots and/or the Robo mascot asset.

Format: vertical 9:16. Target **40 s** (band 30-45 s). Mascot: Robo on every shot. Robo is the PadBot logo (controller face, mortarboard, tassel antenna, mitten hands), assets in `brandbook/assets/mascot/`. Brand: 09-brand-check.md.
Screens are the web app at 1440 wide (`design/web-book/`): record at desktop size and crop or frame them into 9:16. Open and end card: `brandbook/assets/banners/vertical-1080x1920.png`.

## Palette reminder
- C4 Teal Lagoon: teal `#0A7D73` · ink `#13283A` · sun `#FFC233` · tangerine `#FF8A3D` · pink `#FF6FA5` · cap blue `#3A6186` · cheek `#FFB3C7` · cream `#F3FBF9`. No violet, no gradients, no glow.
- Captions: Fredoka 600, ink text on sun or white on teal, 3 px ink outline, hard shadow `5px 6px 0 #13283A`.

## Music mood
Upbeat playful chiptune-pop, no lyrics, ~110 BPM. Soft win sting on the parent delta. Music under captions/VO by ~6 dB.

## Language
Captions carry the story (judges may watch muted). Provide PL and EN caption tracks + optional VO takes. Default: EN captions on screen (the product is English), PL as alternate track.

## Source policy (Recorded vs Generated vs Hybrid)
- **Recorded:** real app UI. Prefer for flow and credibility (P-02, K-03, K-04, K-05, P-04).
- **Generated:** grok-imagine video. Use only for polish the live app cannot show (stylized Robo intro, agent handoff metaphor, end-card flourish).
- **Hybrid:** recorded UI plate + generated motion overlay, or reference-to-video using a real screenshot / Robo PNG as the reference image.
- Prefer Recorded. Generate sparingly.

When generating later: model family = Grok Imagine video (see 04-api.md reference-to-video). Pass a reference image when noted. English prompts below are ready to paste.

---

## Shot list

| # | Time | Dur | Source | App screen / asset | On-screen captions EN / PL | VO EN | VO PL |
|---|---|---|---|---|---|---|---|
| 1 | 0:00-0:04 | 4 s | **Hybrid** | Generated Robo intro over cream bg + burned-in track badge; optional cut to Recorded S0 `/` | EN: `EduBotGames` · `TRACK: Multi-agent + Multiplayer AI` / PL: `EduBotGames` · `TRACK: Multi-agent + Multiplayer AI` | "EduBotGames. Multi-agent. Multiplayer AI." | "EduBotGames. Multi-agent. Multiplayer AI." |
| 2 | 0:04-0:09 | 5 s | **Recorded** | P-02 New goal - Maja, 8, "Multiplication up to 50", 10 questions, tap Create game | EN: `Parent sets the goal` / PL: `Rodzic ustawia cel` | "Parent sets a goal. Multiplication to fifty." | "Rodzic ustawia cel. Mnożenie do pięćdziesięciu." |
| 3 | 0:09-0:15 | 6 s | **Recorded** | Kid voice - mic hold, transcript `Dinosaurs in space`, then K-03 Spark's 3 game cards, kid picks one | EN: `Kid designs by voice` / PL: `Dziecko projektuje głosem` | "Kid designs by voice. Dinosaurs in space!" | "Dziecko projektuje głosem. Dinozaury w kosmosie!" |
| 4 | 0:15-0:23 | 8 s | **Hybrid** | Recorded K-04 Building crew timeline (Prof → Spark → Doodle → Robo) with the xAI call panel as plate; optional Generated handoff flourish layered | EN: `5 Grok agents build the game` / PL: `5 agentów Grok buduje grę` | "Five Grok agents. Tasks, game, sprites. Ready." | "Pięć agentów Grok. Zadania, gra, grafiki. Gotowe." |
| 5 | 0:23-0:30 | 7 s | **Recorded** | K-05 Game - wrong answer → Robo hint bubble; correct → cheer; show avatars + score | EN: `Robo hints, never answers` / PL: `Robo podpowiada, nie zdradza` | "Robo plays along. Hints, not answers." | "Robo gra razem. Podpowiedzi, nie odpowiedzi." |
| 6 | 0:30-0:34 | 4 s | **Recorded** | K-07 Join a friend with room code and "Adding soon" badge. If skipped: add 2 s to shot 5 and 2 s to shot 7 | EN: `Friends join the room` / PL: `Znajomi dołączają do pokoju` | "Friends join with a code." | "Znajomi dołączają z kodem." |
| 7 | 0:34-0:40 | 6 s | **Hybrid** | Recorded P-04 Lens report 40% → 75% as plate; Generated end flourish + tagline card | EN: `40% → 75%` then `AI that teaches, not cheats` / PL: `40% → 75%` then `AI które uczy, nie ściąga` | "Parents see the progress. AI that teaches, not cheats." | "Rodzic widzi postęp. AI które uczy, nie ściąga." |

**Total: 40 s.** Trim to 30 s: drop shot 6, shorten shot 4 to 5 s and shot 5 to 5 s. Extend to 45 s: hold Ready confetti +2 s, end card +3 s.

---

## Per-shot generation notes (only if/when generating later)

### Shot 1 - Hybrid (Generated lead)
- **Reference image:** Robo idle PNG (from design export / `components` asset once exported). Path TBD, `brandbook/assets/mascot/padbot-idle.png`.
- **Ready English prompt (grok-imagine video / reference-to-video):**
  > Cute flat 2D mascot Robo: a sun-yellow #FFC233 game controller with a friendly face and pink cheeks, wearing a cap-blue #3A6186 mortarboard whose pink #FF6FA5 tassel is his antenna, floating mitten hands, no body, idle bob then a small cheerful wave, teal #0A7D73 background, thick ink #13283A outlines, flat fills, hard offset shadow, no gradients, no glow, no text in the video frame, vertical 9:16, 4 seconds.
- Burn track badge and title as **post captions** in the editor (do not ask the video model to render readable UI text).

### Shot 4 - Hybrid (Recorded plate + optional Generated flourish)
- **Primary:** record real K-04 timeline. Speed-ramp if pipeline > 8 s so Ready lands by 0:23.
- **Optional Generated overlay** only if timeline alone feels flat. **Reference image:** screenshot of K-04 building state once captured, e.g. `/captures/s2-timeline.png`.
- **Ready English prompt:**
  > Flat 2D motion graphics of round agent chips handing a small task card left to right, chips in light blue #4CC9F0, pink #FF6FA5, mint #2ED3A0 and sun #FFC233, each lighting up with a ring in its own color, on cream #F3FBF9, thick ink #13283A outlines, hard offset shadow, no gradients, no blur, no readable letters, vertical 9:16, 3 seconds, for overlay on a UI recording.
- Prefer keeping chip labels from the **Recorded** UI, not from generation.

### Shot 7 - Hybrid (Recorded plate + Generated flourish)
- **Primary:** record real P-04 Lens report.
- **Generated end card flourish** after or over the last 2 s. **Reference image:** Robo cheer PNG, `brandbook/assets/mascot/padbot-cheer.png`, and/or P-04 screenshot `/captures/p04-report.png`.
- **Ready English prompt:**
  > Robo, a sun-yellow #FFC233 game controller mascot with a face, pink cheeks and a cap-blue mortarboard with a pink tassel antenna, cheering with both floating mitten hands up, confetti in pink #FF6FA5 tangerine #FF8A3D and cheek #FFB3C7 plus chalk math signs, teal #0A7D73 background, thick ink outlines, flat fills, no gradients, joyful, no text in frame, vertical 9:16, 2 seconds.
- Burn tagline captions in the editor: `AI that teaches, not cheats` (PL track: `AI które uczy, nie ściąga`), then the slogan `Parents pick the topic. Kids pick the game.`

### Shots 2, 3, 5, 6 - Recorded only
No generation. Capture from the live app, or seeded data if the API is down.

---

## Full caption / VO takes (~40 s)

### English captions (muted-safe story)
1. EduBotGames · TRACK: Multi-agent + Multiplayer AI
2. Parent sets the goal
3. Kid designs by voice
4. Prof, Spark, Doodle and Robo build the game
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

1. Primary logo / `vertical-1080x1920` banner for shot 1
2. P-02 New goal - Maja, 8, "Multiplication up to 50", Create game
3. Kid voice + K-03 Pick a game (Spark's cards)
4. K-04 Building - **crew timeline + xAI call panel** (critical)
5. K-05 Game - wrong then right answer, Robo hint bubble
6. K-07 Join a friend - "Adding soon"
7. P-04 Lens report 40% → 75%
8. Robo assets: `brandbook/assets/mascot/padbot-idle|think|hint|cheer.png` (for reference-to-video)

Fallback while filming: seeded game and report (10-architecture.md fallbacks) or `design/web-book/img/*.png`.

Capture the web app at 1440 wide and frame it in 9:16. Hard cuts. Captions large, Fredoka 600, sun or white-on-teal fill, ink outline, bottom-safe.

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

- Shot 6 (friends join) is "Adding soon" per brandbook decisions. Optional in the edit.
- Robo live voice is stretch; this cut shows on-screen hint bubbles only.
- Drawing-photo stretch is not in this cut.
- Pipeline target in app is < 25 s; video compresses shot 4 to ~8 s with speed-ramp. Live product copy may still say "about 30 seconds".
- Generated clips are optional polish. Credibility rests on Recorded UI. Do not generate fake agent chips that disagree with the real K-04 timeline.
- Reference image paths (`/captures/...`) are placeholders until screen captures exist. Robo assets already exist in `brandbook/assets/mascot/`.
- Tagline matches 01-product-spec.md: "AI that teaches, not cheats" / "AI które uczy, nie ściąga".
- Grok Imagine video / reference-to-video is listed in 04-api.md as stretch/pre-record; using it here is post-MVP polish for the submitted video, not a claim that video gen runs inside the product MVP.
