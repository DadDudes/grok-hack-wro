# EduBotGames specs

Read in order:
1. 01-product-spec.md - what we build and why, judging map, demo script
2. 02-agents.md - 5 agents, system prompts, JSON contracts
3. 03-design-brief.md - design agent instructions, Robo mascot, 4 screens, tokens
4. 04-api.md - SpaceXAI API: endpoints, models, tools, extra features that score points
5. 05-app-flow.md - Next.js app flow: routes, screens, states, orchestrator, build order

## SpaceXAI docs for agents
- xai-llms.txt - local copy of https://docs.x.ai/llms.txt (index of every docs page, saved 5 Nov 2026)
- Any docs page as markdown: append `.md` to its URL
- Everything in one file: https://docs.x.ai/llms-full.txt
- Docs MCP server: https://docs.x.ai/api/mcp
- OpenAPI spec: https://docs.x.ai/openapi.json

Rule for coding agents: before calling any SpaceXAI endpoint, open the matching page from xai-llms.txt (.md version) and follow it. Do not guess parameters.
