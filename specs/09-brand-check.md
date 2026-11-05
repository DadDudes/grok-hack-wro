# EduBotGames - brand check (step 9)

Checked 5 Nov 2026 against the real brand sources. These win over any older spec:
- `brandbook/brand.json`, `brandbook/decisions.md`
- `brandbook/assets/tokens/tokens.json` and `tokens.css`
- `brandbook/assets/agents/agents.json` and the agent SVG/PNG states
- `EduBotGames_Brand_Guidelines_v0.1_2026-11.pdf` (38 pages, HTML source `brandbook/index.html`)
- `design/web-book/` (the product screens, desktop 1440 wide)
- `AGENTS.md` section "Brand rules (locked)" and `README.md`

Specs 01-07 were written before the brandbook existed. Where they disagree, fix the spec, not the brand.

## 1. Brand system summary

### Name and lines
- Name: `EduBotGames` (one word, capital E, B, G). Book 1.3: never "Edubot Games", "EduBot games" or "EBG".
- Slogan (confirmed in decisions.md, round 4): "Parents pick the topic. Kids pick the game."
- Tagline (README): "AI that teaches, not cheats."
- Kid line (decisions.md, proposed): "Learn it your way!"

### Logo: PadBot
- A game controller with a face wearing a mortarboard. The tassel is the antenna (brand.json `mark.current`: "B1 PadBot with mortarboard, tassel = antenna").
- Robo is the logo and the main character: the PadBot head with floating mitten hands, no body (AGENTS.md, decisions.md round 4).
- Masters: `brandbook/img/logo/` (outlined Fredoka wordmark, lockups, one-color, symbol). App assets: `brandbook/assets/logo/` (`lockup-light`, `lockup-dark`, `padbot-mark`, `-flat`, `-mono`).
- Clear space: X = the height of the cap. Minimum size: logo 160 px, wordmark 110 px, symbol 24 px; below the minimum use the symbol (book 2.3).
- Logo in use (book 2.7): wordmark for parent panel header, emails, reports, README; primary logo for splash, sign-in, win screen, pitch slides and video end card; symbol for app icon, favicon, notifications.
- Lockups: light = "EduBot" in ink, "Games" in teal on cream; dark = "EduBot" in white, "Games" in sun on teal (README).

### Colour: C4 Teal Lagoon (brand.json `palette.current`)
| Token | Hex | Use (README / book 3.x) |
|---|---|---|
| teal | `#0A7D73` | Brand ground, primary buttons. White text on it (5.01:1). |
| ink | `#13283A` | Outlines, text, hard shadows. |
| sun | `#FFC233` | PadBot head, chips, stars. Ink text only (9.35:1). |
| tangerine | `#FF8A3D` | Highlights. |
| pink | `#FF6FA5` | Tassel, sparkles, confetti. |
| cap-blue | `#3A6186` | Mortarboard (lighter than ink so its outline stays visible). |
| cheek | `#FFB3C7` | Cheeks, confetti. |
| cream | `#F3FBF9` | Page background. |
| white | `#FFFFFF` | Surfaces. |

Extended palette (book 3.2): teal steps 50 `#E2EFEE` to 900 `#182D29`, neutrals stone `#EBF4F2`, line `#E2EBEA`, muted `#566773`; states success `#2E7D32` / tint `#E3F1E2`, warning tint `#FDF0D5`. "States never borrow the brand color."
Rejected: the violet palettes (Q1 Arcade Pop `#7B3FF2` and older `#6C4DF6`). decisions.md round 3: "Violet stays out."

### Type (brand.json `type.current`: "T2 Fredoka 600 + Figtree")
- Fredoka 600: wordmark, headings, buttons and everything a kid reads. Never below 18 px for kids (book 4.1).
- Figtree: UI and parent text.
- Scale (tokens.json, px): hero 44, h1 32, h2 24, h3 20, body 17, small 15, kid-min 18.

### Shape and style tokens (tokens.json)
- Radius: sm 12, md 20, lg 28, pill 999. Buttons: min height 56, radius 22.
- Space: 4, 8, 12, 16, 24, 32, 48, 64.
- Border `3px solid #13283A`. Shadow sticker `5px 6px 0 #13283A`, sticker-sm `3px 4px 0 #13283A`.
- Flat fills, no gradients, no blur shadows ("Stickers, not gloss", book 1.2).
- Icons: Lucide, 2 px stroke, always with a label (book 5.4). Graphic elements: chalk signs (+ x / =), stickers, task card.

### Characters: Robo plus a crew of 4 (agents.json, book 5.1-5.3)
| Key | Name | Role | Side | Color | Sample line |
|---|---|---|---|---|---|
| robo | Robo | Teammate, the lead (logo) | Kid | `#FFC233` | "Close! Try counting by 7s. Maja, your turn!" |
| prof | Prof | Pedagogue | Parent | `#4CC9F0` | "Multiplication to 50 for age 8. I made 10 tasks, easy to hard." |
| spark | Spark | Game Designer | Kid | `#FF6FA5` | "Dinosaurs in space! Catch star eggs, dodge comets or beat the space boss?" |
| doodle | Doodle | Artist | Kid | `#2ED3A0` | "Painting Rex, his rocket and four shiny space rocks..." |
| lens | Lens | Analyst | Parent | `#FF8A3D` | "Maja went from 40% to 75%. Practise 7x and 8x next." |

- Props: Prof glasses + pencil behind the ear, Spark lightbulb antenna, Doodle beret + brush, Lens magnifier with a chart.
- Robo always appears bigger and first (book 5.2). The name "Scout" is rejected (decisions.md round 4).
- Agent motion states: idle, working, handoff, done (files `brandbook/assets/agents/{key}-{state}.svg|png` plus `{key}-head`). Book 5.3: idle bob 4 px 2.4 s; working glow ring in the agent color 1.2 s plus prop loop; handoff task card flies to next agent 500 ms ease-out; done pop to 112% with mint check 300 ms. Respect `prefers-reduced-motion` (color and badge only).
- Robo in-game poses: idle, think, hint, cheer (`brandbook/assets/mascot/padbot-*.svg|png`).

### Voice (book 1.3): "Talk to kids like a fun older friend. Talk to parents in plain numbers."
| Rule | Say | Not |
|---|---|---|
| Short and warm | Try counting by 7s. | The answer is 42. |
| Hint, never tell | What do you want to play? | Select a game template. |
| Cheer the try (in the game's theme) | Roar-some! Dino power! | Correct. Proceed to the next item. |
| Numbers for parents | Maja went from 40% to 75%. Practise 7x and 8x next. | Amazing AI-powered learning outcomes! |

Principles (book 1.2): Teach, never cheat. The kid is the designer. Calm for parents, bright for kids. Stickers, not gloss.

### Platform and product rules
- Web app in the browser, screens in `design/web-book/` at desktop 1440 wide (decisions.md "Platform"). `design/mobile-book/` is a future mobile version, not the current product.
- English in the product, the book and the code (AGENTS.md working rules). No em or en dashes.
- Demo kid in the designs and README: Maja, age 8, "Multiplication up to 50", 10 questions, theme "Dinosaurs in space".
- Join a friend (K-07) is shown with an "Adding soon" badge; not built yet.

### Do / Don't (from book 1.2, 2.6, 3.3, AGENTS.md)
Do:
- Use tokens from `brandbook/assets/tokens/` only.
- White text on teal only; ink text on sun, tangerine, pink and cream.
- Show Robo bigger and first; crew in the order Prof, Spark, Doodle, Lens for the build timeline.
- Use the logo master files, never live type for the wordmark.
- Use the agent color for the working glow ring, mint check for done.

Don't (logo don'ts, book 2.6):
- Any other logo color; full color on ink (the line disappears); stretching, squeezing or rotating.
- Another typeface or spelling; soft shadows, glows or blur; a crew member as the logo; an all-teal wordmark.
- White text on sun (contrast 1.61, "Never"). Gradients. Violet.
- Drop the face, cheeks or tassel-antenna (it turns into a stock pad-and-cap icon).

## 2. Mismatch table (old specs vs brandbook)

| # | Where | Old spec says | Brandbook says | Fix (done in this pass) |
|---|---|---|---|---|
| 1 | 03, 06 slide 7, 07 | Palette purple `#6C4DF6`, yellow `#FFC93C`, mint `#2ED3A0`, coral `#FF6B6B`, ink `#1E1B3A`, cream `#FFF8EC` | C4 Teal Lagoon: teal `#0A7D73`, ink `#13283A`, sun `#FFC233`, tangerine `#FF8A3D`, pink `#FF6FA5`, cap blue `#3A6186`, cheek `#FFB3C7`, cream `#F3FBF9`. Violet rejected. | Replaced in 03, 06, 07 (incl. video generation prompts). |
| 2 | 03, 06 slide 7 | Fonts Baloo 2 or Nunito for headings, Inter for parent text | Fredoka 600 (display, buttons, kid text >= 18 px) + Figtree (UI, parent) | Replaced in 03 and 06. |
| 3 | 03, 06, 07 | Robo = small robot, round head, screen face, one antenna; "poses idle, thinking, hint, cheering" drawn new | Robo = PadBot logo head (controller face + mortarboard, tassel antenna), floating mitten hands, no body. Assets already exist: `mascot/padbot-idle/think/hint/cheer`. | 03 now says reuse existing assets, do not redraw. Video prompts in 07 updated. |
| 4 | 02, 05, 06, 07 | Agents named by role only: Pedagogue, Game Designer, Artist, Teammate Robo, Analyst | Named crew: Robo (Teammate, lead), Prof (Pedagogue), Spark (Game Designer), Doodle (Artist), Lens (Analyst), each with a color and 4 motion states. Name Scout rejected. | 02, 06, 07 use "Name (Role)". 05 left as is (route-level, out of scope); coding agents should use agents.json keys. |
| 5 | 03, 05, 06, 07 | Mobile first 390x844 | Product is a web app, desktop 1440 wide (`design/web-book/`). Mobile book is future. | 03 and 06 updated. 07 notes recording at 1440 and cropping to 9:16. |
| 6 | 06, 07, 05 | Polish UI copy and demo kid "Ola" ("Stwórz grę", "Zagraj znowu", "mnożenie do 50") | English product; demo kid Maja, 8, "Multiplication up to 50", 10 questions | 06 and 07 UI strings and kid name switched to English / Maja. PL captions kept as an alternate video track only. |
| 7 | 03, 06 | "Agent chips: animated glow when active" (generic) | Motion spec: idle bob, working glow in agent color + prop loop, handoff card flight 500 ms, done pop 112% + mint check, reduced-motion fallback | 03 has the exact motion spec. |
| 8 | 06 slide 6 | Next.js 15 + Tailwind + in-memory store `lib/store.ts`, SSE | Real repo: Next.js 16 API in `backend/`, Supabase Postgres + Storage, `packages/api-contract` (zod). Tokens CSS, no Tailwind mention in the brandbook. | 06 slide 6 updated to match 10-architecture.md. |
| 9 | 06 slide 1, 07 | Logo + Robo as two things; "Kids design. Agents build. Robo plays along." subtitle | Robo IS the logo; confirmed slogan "Parents pick the topic. Kids pick the game." | 06 slide 1 uses the slogan and `cover-1920x1080` banner; 07 end card uses `vertical-1080x1920`. |
| 10 | 06, 07 | Join a friend as a "stretch" screen with route `/join` | K-07 designed, shown with "Adding soon" badge, not built | 06 and 07 label it "Adding soon". |
| 11 | 01-07 | Name sometimes written loosely in copy | Only `EduBotGames` | Check copy when building. |
| 12 | design/mobile-book | `scout-*.svg` agent files | Scout rejected; Lens is the Analyst | Flag only (no code or asset changes in this pass). Do not use scout assets. |

## 3. What a coding agent must use
- CSS: import `brandbook/assets/tokens/tokens.css`; fonts Fredoka 600 and Figtree from Google Fonts.
- Timeline chips: map pipeline events to `agents.json` keys `prof`, `spark`, `doodle`, `robo`, `lens`; show `{key}-{state}.svg`.
- Port screen markup from `design/web-book/screens/*.html` (A-02, P-02, P-03, P-04, K-01, K-03, K-04, K-05, K-06).
