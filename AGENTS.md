# EduBotGames - notes for agents

Kids design their own learning game by voice, a team of AI agents builds it, and Robo plays it with them.
Parents set the topic and see progress. Slogan: "Parents pick the topic. Kids pick the game."
Built at Grok Bot Hackathon Wroclaw, 5 Nov 2026. Concept by Cezary Dynak and Bart Szczepanski,
design by Bart Szczepanski.

## Where things are

| Path | What |
|---|---|
| `specs/` | Product spec, the five agents and their prompts, design brief. Source of truth for behavior. |
| `brandbook/index.html` | Brand Guidelines 0.1 (HTML, 32 pages). Approved. No PDF. |
| `brandbook/assets/` | Brand assets: `logo/`, `banners/`, `mascot/`, `agents/`, `tokens/` (SVG + PNG). |
| `brandbook/img/logo/` | Logo masters with outlined type (logo, one-color, symbol, wordmark). |
| `brandbook/decisions.md` | Every brand decision, kept and rejected. Rejections are binding. |
| `brandbook/brand.json` | Brand state: name, palette, mark, mascot. |
| `brandbook/directions-round*.html` | Exploration boards, history only. |
| `design/web-book/` | The product: web app screens, desktop 1440 wide (`screens/web.html`, `img/*.png`). |
| `design/mobile-book/` | Future mobile version: 14 phone screens with motion. Not the current product. |
| `README.md` | Public summary with the design and style section. |

## Brand rules (locked)

- Logo: PadBot, a game controller with a face wearing a mortarboard. The tassel is the antenna.
- Robo is the logo and the main character: PadBot head, floating mitten hands, no body. Always bigger
  and first. Crew: Prof (Pedagogue, parent), Spark (Game Designer, kid), Doodle (Artist, kid),
  Lens (Analyst, parent). The name Scout is rejected.
- Palette C4 Teal Lagoon: teal `#0A7D73`, ink `#13283A`, sun `#FFC233`, tangerine `#FF8A3D`,
  pink `#FF6FA5`, cap blue `#3A6186`, cheek `#FFB3C7`, cream `#F3FBF9`. White text on teal only;
  never white on sun. The violet palette is rejected.
- Type: Fredoka 600 for the wordmark, headings, buttons and kid text (kid text at least 18 px);
  Figtree for UI and parent text.
- Style: flat fills, 3 px ink lines, hard offset ink shadow (`5px 6px 0 #13283A`). No gradients,
  no blur shadows. Buttons at least 56 px tall, radius 20 to 28.
- Tokens: `brandbook/assets/tokens/tokens.css` and `tokens.json`. The portal uses only these.
- Agent motion states: idle, working, handoff, done. Respect `prefers-reduced-motion`.
- Spark offers 2 or 3 game types in the kid's theme; the kid picks one. The game itself is generated
  by the engine, built by a teammate: its API takes the parent's inputs (topic, age, number of
  questions) and the kid's inputs (voice idea, chosen game type).
- The target app is Next.js. Port the design markup from `design/web-book/` into components; screens
  that are not designed there are built directly in the app on the same tokens.

## Shared helpers

Reuse these instead of writing new drawing code. All live in `brandbook/_src/`.

| Module | Use |
|---|---|
| `board_kit.py` | Colour maths (`contrast`, `de76`, `mix`, `tint`, `shade`), board page builders. |
| `marks.py` | Base shapes: `PAD_PATH`, `robo_arms`, `pixel_grid`, mic glyph. |
| `marks2.py` | `cap()` mortarboard, `sticker()` hard shadow, `colors()` palette mapping. |
| `padbot.py` | `padbot(c, pose)` logo head, `mascot(c, pose)` Robo with mitten hands. |
| `agents.py` | `AGENTS` list, `agent_colors()`, `sticker_figure()`, `sticker_head()` for the crew. |
| `export.py` | `svg_doc()`; running it rebuilds logo, banners, mascot and tokens. |
| `export_agents.py` | Rebuilds `brandbook/assets/agents/` and `agents.json`. |
| `book_masters.py` | Rebuilds the logo masters in `brandbook/img/logo/` and the book symbols. |
| `svg2png.py` | Renders every SVG under a folder to a PNG of the same size (headless Chrome). |

Rebuild everything after a change:

```bash
python3 brandbook/_src/export.py
python3 brandbook/_src/export_agents.py
python3 brandbook/_src/book_masters.py
uv run --with playwright python brandbook/_src/svg2png.py "$PWD/brandbook/assets"
```

## Working rules

- English in the product, the book and the code. No em or en dashes anywhere. No code comments.
- Do not commit or push; the owner commits after testing. Ask before deleting any file.
- Secrets live in `.env` (`XAI_API_KEY`, the name the backend reads; copy it to `backend/.env.local`), git-ignored.
- Open pages in Brave, not Chrome. Check pages with the Claude in Chrome extension over
  `http://127.0.0.1`, never `file://`.
