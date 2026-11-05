# EduBotGames - design brief (step 1)

## Instructions for the design agent
You are designing EduBotGames, a web app (mobile browser first, 390x844, plus a desktop 1440x900 version of the parent panel) where kids design their own learning game by voice and play it with an AI teammate. Read 01-product-spec.md and 02-agents.md in this folder.

Deliver:
1. Mascot "Robo", the AI teammate: friendly small robot, round head, screen face with big eyes, one antenna. Needs 4 poses: idle, thinking, hint (pointing), cheering. Flat 2D, bold outlines.
2. Design tokens: colors, type scale, radius, spacing, shadows.
3. 4 screens (mobile), high fidelity:
   - S1 Parent setup: goal input with suggestions chips (Multiplication, Spelling, English words, Clocks), age slider 6-12, "Create game" button.
   - S2 Kid prompt: huge mic button, "What do you want to play?", text fallback, below it the live agent timeline (Pedagogue -> Game Designer -> Artist -> Ready) with Robo thinking.
   - S3 Game: Phaser canvas area (show a sample "dinosaurs in space" collect game), top bar with player avatars (2 kids + Robo) and team score, Robo hint bubble.
   - S4 Parent panel: big before/after accuracy (40% -> 75%), skill bars, weak skills, one-line next step, "Play again" button.
4. Export each screen as PNG plus a short component list.

## Style
- Playful, bright, kid-friendly, but clean enough that parents trust it.
- Big rounded buttons (min 56 px tall), radius 20-28.
- Font: Baloo 2 or Nunito for headings, Inter for parent panel text.
- Palette suggestion:
  - Primary purple #6C4DF6
  - Sunny yellow #FFC93C
  - Mint #2ED3A0
  - Coral #FF6B6B
  - Ink #1E1B3A
  - Background cream #FFF8EC
- Agent timeline: each agent a colored chip with an icon, animated glow when active.
- No dark patterns, no ads look, no tiny text for kids.

## Demo needs
- Every screen must read in 2 seconds in a 30-45 s vertical video.
- Robo appears on every screen so the video feels like one character story.
