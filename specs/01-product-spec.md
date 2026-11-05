# EduBotGames - product spec

Hackathon: Grok Bot Hackathon Wroclaw, Callstack, 5 Nov 2026. Build sprint 18:00-21:00.
Tracks: Multiplayer AI + Multi-agent Systems. Budget: $60 SpaceXAI API credits.

## One-liner
Kids design their own learning game by voice, a team of AI agents builds it in seconds, and an AI teammate plays it with them, while the parent sees measurable progress.

## Problem
- Kids use AI to get answers, not to learn (negative effect of AI).
- Learning apps are generic, kids get bored.
- Parents and teachers have no clear signal whether a kid actually improved.

## Solution
1. Parent or teacher sets a learning goal (e.g. "multiplication up to 50").
2. Kid says what they want to play (e.g. "dinosaurs in space").
3. Agents generate a Phaser game that matches the kid's idea and carries the parent's content.
4. Kid plays, friends can join the same room, an AI teammate gives hints, never answers.
5. Parent panel shows before/after score and what to practice next.

## Users
- Kid 6-12 (player, game designer by voice)
- Parent / teacher (goal setter, sees stats)
- Friends (join by room code)

## Stack (decided)
- Web based, mobile browser friendly
- Phaser 3 for games
- SpaceXAI API (https://api.x.ai, OpenAI compatible) - exact endpoints, models and tools in 04-api.md
  - Text / agents: grok-4.7 via /v1/responses or /v1/chat/completions
  - Images: Grok Imagine (sprites, backgrounds)
  - Voice: Grok Voice (kid speech in, bot voice out)
  - Use the global endpoint (US endpoint has no image/voice)
- Game = fixed Phaser templates filled with a JSON "game spec" produced by agents

## Game templates (MVP: build 1, stretch 3)
1. Collect - run around, collect the item with the correct answer
2. Runner - jump over obstacles, pick the correct gate
3. Quiz battle - pick the answer, team vs boss

## Screens
1. Parent setup - goal, age, number of questions
2. Kid "What do you want to play?" - big mic button, live agent pipeline view
3. Game - Phaser canvas, 1-3 players, AI teammate hint bubble
4. Parent panel - before/after score, hard questions, time, next step

## MVP scope (must work end-to-end for demo)
- One template (Collect) fully working
- Parent goal -> kid prompt (voice or text fallback) -> agents -> JSON -> Phaser game
- AI teammate hints in game
- Score saved, parent panel shows before/after (seed one "before" session)
- Visible agent handoff timeline on screen 2

## Stretch
- Multiplayer room code (2 kids, same game, shared score)
- Voice reply from bot
- Second template

## Judging map
| Criterion | How we hit it |
|---|---|
| Working prototype | Full path goal -> voice -> game -> stats runs live |
| Technical complexity | 5 cooperating agents, JSON handoffs, text + image + voice APIs |
| Innovation | Kid designs the game; AI is a teammate, not a teacher or answer machine |
| Real-world impact | AI that teaches instead of doing the work; measurable delta before/after |
| Theme alignment | Kids + parent + agents working toward one shared learning goal |

## Demo / video (30-45 s, TikTok style)
1. 0-8 s: parent types "multiplication to 50", kid says "dinosaurs in space"
2. 8-18 s: agent timeline lights up, game appears
3. 18-35 s: two kids play, bot gives a hint, correct answer
4. 35-45 s: parent panel 40% -> 75%, "AI that teaches, not cheats"
