# EduBotGames - SpaceXAI API integration (verified against docs.x.ai, 5 Nov 2026)

Docs index: see xai-llms.txt in this folder (copy of https://docs.x.ai/llms.txt). Always check the .md page there before using an endpoint.

Base URL: https://api.x.ai/v1 (global endpoint; the US endpoint has no image/voice)
Auth: Authorization: Bearer $XAI_API_KEY (server side only, never in the browser)
OpenAI compatible: use the OpenAI SDK with base_url https://api.x.ai/v1, or @ai-sdk/xai.

## 0. First thing: test the key (2 min)
```
curl -s https://api.x.ai/v1/models -H "Authorization: Bearer $XAI_API_KEY" | jq '.data[].id'
```
Confirm grok-4.7, grok-imagine-image-2.0 and grok-voice-latest are on the list. The response also carries pricing.

## 1. Agents - Responses API
POST /v1/responses, model grok-4.7 (fallback grok-4.6)
- Chain agents with previous_response_id so context is kept server side (stored 30 days).
- Function calling: tools [{type:"function", name, description, parameters}]. Model returns function_call items, we run them and send function_call_output with call_id.
- Built-in tool: web_search (tools supported today are functions and web search).

### Tools per agent (this is what scores "Technical Complexity")
| Agent | Function tools we expose |
|---|---|
| Pedagogue | get_last_report(kid_id), save_tasks(tasks) |
| Game Designer | list_templates(), save_game_spec(spec) |
| Artist | generate_image(prompt, kind) -> wraps /v1/images/generations, get_cached_asset(theme) |
| Teammate | get_game_state(room), send_hint(text, next_player) |
| Analyst | get_session_results(session), save_report(report), notify_pedagogue(feedback) |

An Orchestrator (plain code, not an LLM) runs the pipeline and pushes each step to the timeline UI over WebSocket/SSE, so judges see the agents hand off live.

## 2. Images - Grok Imagine
POST /v1/images/generations
```
{"model":"grok-imagine-image-2.0","prompt":"...","n":4}
```
- $0.04 per image, 1K/2K, up to 10 images per request, aspect ratio and response format configurable.
- Supports editing with up to 5 reference images: use the hero sprite as a reference to keep the character consistent across items.
- Budget: max 6 images per new game, cache by theme. 1000 images would be $40, so we are safe with $60.

## 3. Voice - Grok Voice
Option A (simplest, MVP): kid speech -> text
- Streaming STT: wss://api.x.ai/v1/stt (default model grok-voice-transcribe-2.0), 38+ languages incl. Polish. $0.20/hour streaming, $0.10/hour batch.

Option B (wow factor, stretch): Robo talks live
- Speech to speech: wss://api.x.ai/v1/realtime?model=grok-voice-latest, $0.08/min, sub-second, supports tool use (function calls) inside the voice session.
- Browser: get an ephemeral client secret from our server, then connect with Sec-WebSocket-Protocol: xai-client-secret.<TOKEN>. Never ship the API key to the client.
- Session: session.update with voice (e.g. "eve"), instructions = Teammate prompt, turn_detection server_vad, tools = send_hint / get_game_state.

TTS only: POST /v1/tts or wss://api.x.ai/v1/tts for Robo reading hints aloud.

## 4. Video (skip for MVP)
Grok Imagine video exists in the API. Possible stretch: a 5 s "your game is ready" intro clip. Not worth the time in 3 h.

## Winning integration story (say this in the pitch)
"Five Grok agents on the Responses API with function calling, Grok Imagine for every sprite, and Grok Voice so kids design games by talking, with Robo answering live."
That touches text, tools, image and voice APIs in one flow.

## Docs
- API reference: https://docs.x.ai/developers/rest-api-reference/inference
- Function calling: https://docs.x.ai/developers/tools/function-calling
- Imagine: https://docs.x.ai/developers/model-capabilities/imagine
- Voice: https://docs.x.ai/developers/model-capabilities/audio/voice

---

# Full-docs pass (docs.x.ai/overview + llms.txt index, 5 Nov 2026)
Tip: every docs page has a .md version (append .md). Full dump: https://docs.x.ai/llms-full.txt. Docs MCP server for your coding agent: https://docs.x.ai/api/mcp

## Extra features that can win points (ranked by value / effort)

1. Structured Outputs (text/structured-outputs). Give each agent a JSON schema, the API guarantees valid JSON. Kills parsing bugs in the pipeline. MUST use. Effort: low.
2. Image Understanding (images/understanding). Kid DRAWS their hero on paper, takes a photo; Game Designer "sees" it. Also Teammate can look at a game screenshot. Big wow, matches "kid designs the game". Effort: low.
3. Image Editing / Multi-Image Editing (up to 5 reference images). Turn the kid's drawing into a clean game sprite and keep the same hero across all items. Effort: low.
4. Custom Moderation Controls (advanced-api-usage/custom-moderation-controls). Kid safety is a Real-World Impact point: say "every prompt and image goes through moderation". Read the page before claiming specifics. Effort: low-medium.
5. Text to Speech with per-character timestamps (audio/text-to-speech, see cookbook "Article to Read-Along"). Robo reads questions aloud and highlights words, great for 6-8 year olds who can't read well yet. Effort: medium.
6. Ephemeral Tokens (audio/ephemeral-tokens). Browser connects to realtime voice safely, no key in client. Needed if we do live Robo voice. Effort: low.
7. Reference-to-Video (video/reference-to-video, cookbook "Photo to Talking Character"). Kid's drawing comes alive and says "Let's play!". Perfect 3 s opener for the TikTok video. Pre-generate before demo. Effort: medium, costs credits.
8. Code Execution tool (tools/code-execution). Analyst computes before/after stats in a sandbox and returns numbers + chart. Shows server-side tools. Effort: low.
9. Collections Search / RAG (tools/collections-search). Upload a curriculum doc (e.g. Polish "podstawa programowa" for grade 1-3 math) so Pedagogue grounds tasks in the real curriculum. Real-world credibility. Effort: medium.
10. Prompt Caching + Cost Tracking. Shared system prompts cached, cost per game shown in a corner of the admin view ("one game = $0.0x"). Shows scale potential. Effort: low.
11. Remote MCP tools (tools/remote-mcp). Our own tiny MCP server (get_game_state, save_score) called by the model server side. Optional, only if time.

## Model choices
- grok-4.7: all agents (500k context, $2 / 1M input, $6 / 1M output, agentic tool calling).
- grok-4.20-multi-agent (beta): built-in team of 4 or 16 agents with a leader. NO custom function calling, only built-in tools (web_search, x_search, code_execution, collections_search) and remote MCP, Responses API only. Use case for us: optional "Curriculum Researcher" for parents ("what should my 8-year-old know in math?"). Do NOT use it for the game pipeline.
- grok-imagine-image-2.0: sprites, backgrounds, drawing-to-sprite edits.
- Grok Imagine video: talking character intro (stretch).
- grok-voice-latest (realtime), grok-voice-transcribe-2.0 (STT), TTS endpoint.

## Grok Bot (the "Grok Bot" in the judging criteria)
Grok Bot is the product of persistent AI teammates with their own cloud computers that message each other, share group chats and pass tasks. Docs do not show it as a public developer API. How to use it for points:
- Build with it: our team used Grok Bots as teammates during the hackathon (specs, design, research). Say it in the pitch and show it in the video.
- Product angle (roadmap slide): a parent-facing Grok Bot that sends a weekly progress note and schedules the next game as a routine.
- Ask organizers if they expect Grok Bot usage inside the product.

## Updated pitch line
"Kids draw their hero and say what they want to play. Five Grok agents with structured outputs and function calling turn it into a curriculum-grounded Phaser game, Grok Imagine turns the drawing into sprites, Grok Voice lets Robo talk and play along, and every result is measured for the parent. Built with Grok Bots as our teammates."

## Suggested MVP cut for remaining sprint time
Must: structured outputs, 5 agents, image gen, STT, 1 template, parent panel.
Add if 30 min spare: drawing photo -> image understanding + edit into hero sprite.
Pre-record for video: talking character intro clip.
