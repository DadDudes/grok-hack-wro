# EduBotGames specs

Read in order:
1. 01-product-spec.md - what we build and why, judging map, demo script
2. 02-agents.md - 5 agents (Robo, Prof, Spark, Doodle, Lens), system prompts, JSON contracts
3. 03-design-brief.md - design brief matched to the brandbook: PadBot/Robo, crew, web-book screens, tokens
4. 04-api.md - SpaceXAI API: endpoints, models, tools, extra features that score points
5. 05-app-flow.md - Next.js app flow: routes, screens, states, orchestrator, build order (written before the real repo; for the stack follow 10)
6. 06-pitch-flow.md - deck outline for judges
7. 07-promo-video-script.md - 30-45 s promo video script
8. 08-impact-measurement.md - pre/play/post learning gain and metrics
9. 09-brand-check.md - brand system summary (tokens, fonts, crew, voice, do/don't) and fixes applied to older specs
10. 10-architecture.md - real stack (Next.js 16 API in backend/, Supabase, api-contract), xAI endpoint per agent, tables, realtime, cost, visible API usage, build order

If a spec disagrees with the brandbook (`brandbook/`, Brand Guidelines PDF) or the real repo, those win. 03 is updated to the brandbook.

## SpaceXAI docs for agents
- xai-llms.txt - local copy of https://docs.x.ai/llms.txt (index of every docs page, saved 5 Nov 2026)
- Any docs page as markdown: append `.md` to its URL
- Everything in one file: https://docs.x.ai/llms-full.txt
- Docs MCP server: https://docs.x.ai/api/mcp
- OpenAPI spec: https://docs.x.ai/openapi.json

Rule for coding agents: before calling any SpaceXAI endpoint, open the matching page from xai-llms.txt (.md version) and follow it. Do not guess parameters.
