# ConsenStat

Anonymous, real-time exam sentiment voting for University of Waterloo students.

Users can search exams, create new ones with duplicate detection, and vote on whether an exam was `TOUCHING` or `TOUCHY`. Tallies are stored in D1 and pushed live over Durable Object WebSockets.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Cloudflare Workers with Hono
- Data: Cloudflare D1
- Real-time: Cloudflare Durable Objects + WebSockets
- Tooling: bun, Wrangler

## Features

- Search recent or matching exams
- Create new exam entries by faculty, course number, term, and exam name
- Duplicate detection before exam creation
- One vote per browser per exam, with vote updates allowed
- Live tally updates on exam pages
- Anonymous vote tracking via signed httpOnly cookie + hashed device ID

## Repo Layout

```text
src/client/        React app
src/worker/        Cloudflare Worker, API routes, Durable Object logic
migrations/        D1 schema
public/            Static assets
plan.md            Original implementation plan
wrangler.toml      Worker, D1, Durable Object, and asset bindings
```

## Scripts

- `bun run dev` - start the Vite frontend on port `5173`
- `bun run build` - build the frontend into `dist/`
- `bun run check` - run TypeScript type-checking
- `bun run worker:types` - regenerate Wrangler environment types
- `bun run deploy` - deploy the Worker and static assets with Wrangler

## Local Development

1. Install dependencies:

```bash
bun install
```

1. Type-check the project:

```bash
bun run check
```

1. Build the frontend bundle:

```bash
bun run build
```

### Important local setup notes

- The app expects a Cloudflare D1 database bound as `DB`.
- The Worker expects a `COOKIE_SECRET` secret binding.
- The Durable Object binding is `EXAM_ROOMS`.
- The SQL schema lives in [migrations/0001_initial.sql](/home/balaji/Documents/code/consenStat/migrations/0001_initial.sql).
- `bun run dev` only starts the Vite frontend. This repo does not currently include a Vite proxy or a combined local full-stack script, so `/api/*` and WebSocket features are not fully wired for standalone local frontend dev.

## Runtime Architecture

- `src/client/main.tsx` mounts a `HashRouter` app with three routes:
  - `/` recent exams and search
  - `/create` exam creation flow
  - `/exam/:id` live results and voting
- `src/worker/index.ts` serves the API under `/api/*` and falls through to static assets for everything else.
- `src/worker/room.ts` keeps the latest tally snapshot per exam room and broadcasts updates to connected WebSocket clients.
- Votes are stored in `votes`, while `exam_stats` maintains the aggregate counters used by the UI.

## Data Model

Defined in [migrations/0001_initial.sql](/home/balaji/Documents/code/consenStat/migrations/0001_initial.sql):

- `courses`
- `terms`
- `exams`
- `votes`
- `exam_stats`

## Deployment Notes

- Worker entrypoint: [src/worker/index.ts](/home/balaji/Documents/code/consenStat/src/worker/index.ts)
- Static asset directory: `dist`
- Wrangler config: [wrangler.toml](/home/balaji/Documents/code/consenStat/wrangler.toml)
- Before deploy, make sure the D1 database exists, the schema has been applied, and `COOKIE_SECRET` has been set in Wrangler.

## Current Scope

Implemented now:

- exam creation
- duplicate checking
- search and recent listings
- anonymous voting
- live tally updates
