# EduBotGames - design brief (updated to the brandbook, 5 Nov 2026)

Source of truth: `EduBotGames_Brand_Guidelines_v0.1_2026-11.pdf`, `brandbook/` (tokens, agents, mascot, logo, decisions.md) and `design/web-book/`. See 09-brand-check.md for the full summary and the list of fixes. If this brief and the brandbook disagree, the brandbook wins.

## Instructions for the design / frontend agent
EduBotGames is a WEB APP in the browser, designed at desktop width 1440 (`design/web-book/`). Kids design their own learning game by voice and play it with Robo, an AI teammate. Read 01-product-spec.md, 02-agents.md and 10-architecture.md.

Do not redraw the brand. Reuse:
1. Robo (logo and main character): PadBot head, a game controller with a face and a mortarboard, the tassel is the antenna, floating mitten hands, no body. In-game poses already exist: `brandbook/assets/mascot/padbot-idle|think|hint|cheer.svg|png`.
2. The crew for the build timeline: Prof (Pedagogue, parent side), Spark (Game Designer, kid side), Doodle (Artist, kid side), Lens (Analyst, parent side). Files `brandbook/assets/agents/{prof|spark|doodle|robo|lens}-{head|idle|working|handoff|done}.svg|png`, metadata in `agents.json`. Robo always bigger and first. Never use "Scout".
3. Tokens: `brandbook/assets/tokens/tokens.css` and `tokens.json`. The app uses only these.
4. Screens: port markup from `design/web-book/screens/web.html`, `web-kid1.html`, `web-kid2.html` (PNG references in `design/web-book/img/`):
   - A-02 Log in
   - P-02 New goal: topic, kid age, number of questions (demo: Maja, 8, "Multiplication up to 50", 10)
   - P-03 Prof's preview: 10 tasks easy to hard, editable
   - K-01 Kid home
   - K-03 Pick a game: Spark offers 2 or 3 game types in the kid's theme (Collect, Runner, Quiz battle)
   - K-04 Building: the crew hands off (agent timeline) while the game builds
   - K-05 Game: Phaser canvas from the engine, players (Maja, Leo, Robo), Robo hint bubble
   - K-06 Win
   - P-04 Lens report: before and after (40% to 75% demo data), per-skill bars, weak skills, one next step
   - K-07 Join a friend: room code, shown with an "Adding soon" badge
   Screens not designed there (for example voice listening on web, xAI call timeline panel) are built in the app on the same tokens.

## Style (from the brandbook)
- Principles: Teach, never cheat. The kid is the designer. Calm for parents, bright for kids. Stickers, not gloss.
- Palette C4 Teal Lagoon:
  - teal `#0A7D73` brand ground, primary buttons, white text on it
  - ink `#13283A` outlines, text, hard shadows
  - sun `#FFC233` PadBot head, chips, stars, ink text only
  - tangerine `#FF8A3D` highlights
  - pink `#FF6FA5` tassel, sparkles, confetti
  - cap blue `#3A6186` mortarboard
  - cheek `#FFB3C7` cheeks, confetti
  - cream `#F3FBF9` page background
  - Extended: teal 50 to 900, stone `#EBF4F2`, line `#E2EBEA`, muted `#566773`, success `#2E7D32`. States never borrow the brand color.
  - White text on teal only. Never white on sun, tangerine or pink. No violet.
- Type: Fredoka 600 for wordmark, headings, buttons and all kid text (min 18 px). Figtree for UI and parent text. Scale: hero 44, h1 32, h2 24, h3 20, body 17, small 15.
- Shape: flat fills, `3px solid #13283A` ink line, hard offset shadow `5px 6px 0 #13283A` (small `3px 4px 0`). No gradients, no blur shadows, no glows on the logo.
- Buttons at least 56 px tall, radius 20 to 28 (token: 22). Radius tokens 12 / 20 / 28 / pill.
- Icons: Lucide, 2 px stroke, always with a label.
- Graphic elements: chalk signs (+ x / =), stickers, task card.

## Agent timeline (K-04 and the parent view)
- One chip per agent in order Prof, Spark, Doodle, then Robo ready; Lens appears after the game.
- Chip uses the agent color from agents.json (Prof `#4CC9F0`, Spark `#FF6FA5`, Doodle `#2ED3A0`, Robo `#FFC233`, Lens `#FF8A3D`).
- Motion (book 5.3): idle bob 4 px, 2.4 s ease-in-out, chip white; working glow ring in agent color 1.2 s plus prop loop; handoff task card flies to the next agent, 500 ms ease-out, next chip lights up; done pop to 112% and back with mint check, 300 ms. `prefers-reduced-motion`: color and badge only.
- Each chip may also show the xAI call it made (model, latency, cost). See 10-architecture.md "Visible API usage".

## Logo use
- Wordmark: parent panel header, emails, reports. Primary logo: splash, sign-in, win screen, pitch and video end card. Symbol: app icon, favicon, notifications.
- Clear space = cap height. Minimum: logo 160 px, wordmark 110 px, symbol 24 px.
- Don'ts: other colors, full color on ink, stretch, rotate, other typeface or spelling, soft shadows or glows, a crew member as the logo, an all-teal wordmark.
- Name is always `EduBotGames`.

## Voice
- Kids: a fun older friend. Short and warm, one idea per line, hint never tell, cheer the try in the game's theme ("Roar-some! Dino power!").
- Parents: plain numbers. Before and after, then one next step ("Maja went from 40% to 75%. Practise 7x and 8x next.").
- Product language is English.

## Demo needs
- Every screen reads in 2 seconds in a 30-45 s video.
- Robo appears on every kid screen so the video feels like one character story.
- Banners for pitch and video: `brandbook/assets/banners/cover-1920x1080`, `vertical-1080x1920`, `readme-1280x640`, `splash-390x844`.
