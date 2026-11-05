# Test accounts

The app has no real authentication yet. The login is a demo: any email and password log in as the
demo parent. Sessions and kid profiles live in the browser (`localStorage`). Clear site data to start
over.

## Demo family

| Role | Name | Login | Notes |
|---|---|---|---|
| Parent | Anna | `anna@example.com` / `maja-and-leo` | Prefilled on `/login`. Any other email also logs in as Anna. |
| Kid | Maja | no login, picked by the parent | Age 8, profile colour pink `#FF6FA5` |
| Kid | Leo | no login, picked by the parent | Age 9, profile colour sky `#4CC9F0` |

Defined in `frontend/lib/flow/mock.ts` (`demoParent`, `demoKids`) and
`frontend/components/screens/LoginScreen.tsx` (`DEMO_PASSWORD`).

## Demo story

- Parent goal: "Multiplication up to 50", Maja, age 8, 10 questions.
- Kid idea: "dinosaurs in space". Spark offers Collect, Runner and Quiz battle.
- Report example: Maja goes from 40% to 75%, weak skills 7x and 8x.

## Join a friend

`/join` (room code) is shown with an "Adding soon" badge. There is no working room code yet.

## Modes

| Mode | How | What runs |
|---|---|---|
| Mock | `NEXT_PUBLIC_FLOW_MOCK=1` in `frontend/.env.local` | The whole flow on demo data, no xAI calls, no backend |
| Live | `NEXT_PUBLIC_FLOW_MOCK=0` (default) | Prof, Spark, Doodle, Robo and Lens call the xAI API; games go to the backend on port 3001 |

Start both apps with `./run.sh` (API on http://localhost:3001, app on http://localhost:3000).
